package shop

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sort"
	"strings"
	"time"

	"deekub-api/internal/auth"
	"deekub-api/internal/catalog"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type CartItem struct {
	ProductID     string            `json:"product_id"`
	Quantity      int               `json:"quantity"`
	ExpectedPrice int64             `json:"expected_price_minor"`
	Fields        map[string]string `json:"account_fields"`
}
type Checkout struct {
	Items []CartItem `json:"items"`
}

func (h *Handler) createOrder(c *gin.Context) {
	key := c.GetHeader("Idempotency-Key")
	if !uuidPattern.MatchString(key) {
		fail(c, 400, "invalid_idempotency_key")
		return
	}
	var input Checkout
	if !decode(c, &input) {
		return
	}
	if len(input.Items) == 0 || len(input.Items) > 20 {
		fail(c, 400, "invalid_cart")
		return
	}
	seen := map[string]bool{}
	for _, i := range input.Items {
		if !uuidPattern.MatchString(i.ProductID) || i.Quantity < 1 || i.Quantity > 10 || seen[i.ProductID] || len(i.Fields) > 6 {
			fail(c, 400, "invalid_cart")
			return
		}
		seen[i.ProductID] = true
		for _, v := range i.Fields {
			if strings.TrimSpace(v) == "" || len(v) > 150 {
				fail(c, 400, "invalid_account_fields")
				return
			}
		}
	}
	sort.Slice(input.Items, func(i, j int) bool { return input.Items[i].ProductID < input.Items[j].ProductID })
	source, _ := json.Marshal(input)
	digest := sha256.Sum256(source)
	hash := hex.EncodeToString(digest[:])
	id, err := h.reserveOrder(c.Request.Context(), auth.Current(c).ID, key, hash, input)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) reserveOrder(ctx context.Context, user, key, hash string, input Checkout) (string, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(context.Background())
	// Serialize retries before stock locks; separate users never share a checkout key.
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, user+":"+key); err != nil {
		return "", err
	}
	var id, existingHash string
	err = tx.QueryRow(ctx, `SELECT id::text,request_hash FROM orders WHERE user_id=$1 AND idempotency_key=$2`, user, key).Scan(&id, &existingHash)
	if err == nil {
		if hash != existingHash {
			return "", businessError{"idempotency_conflict"}
		}
		return id, nil
	}
	if err != pgx.ErrNoRows {
		return "", err
	}
	type snapshot struct {
		item                         CartItem
		name, kind, platform, region string
		price                        int64
	}
	entries := []snapshot{}
	var total int64
	for _, item := range input.Items {
		entry := snapshot{item: item}
		var published bool
		var stock int
		var currency string
		var fieldsJSON []byte
		err = tx.QueryRow(ctx, `SELECT name,product_type,platform,region,price_minor,currency,is_published,stock_quantity,COALESCE(metadata->'account_fields','[]'::jsonb) FROM products WHERE id=$1 FOR UPDATE`, item.ProductID).Scan(&entry.name, &entry.kind, &entry.platform, &entry.region, &entry.price, &currency, &published, &stock, &fieldsJSON)
		if err == pgx.ErrNoRows || (err == nil && !published) {
			return "", businessError{"product_unavailable"}
		}
		if err != nil {
			return "", err
		}
		if currency != "THB" {
			return "", businessError{"currency_unsupported"}
		}
		if stock < item.Quantity {
			return "", businessError{"out_of_stock"}
		}
		if entry.price != item.ExpectedPrice {
			return "", businessError{"price_changed"}
		}
		var fields []catalog.AccountField
		if err = json.Unmarshal(fieldsJSON, &fields); err != nil {
			return "", err
		}
		if len(item.Fields) != len(fields) {
			return "", businessError{"invalid_account_fields"}
		}
		for _, f := range fields {
			if strings.TrimSpace(item.Fields[f.ID]) == "" {
				return "", businessError{"invalid_account_fields"}
			}
		}
		total += entry.price * int64(item.Quantity)
		entries = append(entries, entry)
	}
	err = tx.QueryRow(ctx, `INSERT INTO orders(user_id,total_minor,idempotency_key,request_hash) VALUES($1,$2,$3,$4) RETURNING id::text`, user, total, key, hash).Scan(&id)
	if err != nil {
		return "", err
	}
	for _, e := range entries {
		fields := e.item.Fields
		if fields == nil {
			fields = map[string]string{}
		}
		encoded, _ := json.Marshal(fields)
		if _, err = tx.Exec(ctx, `INSERT INTO order_items(order_id,product_id,name,product_type,platform,region,quantity,unit_price_minor,account_fields) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, id, e.item.ProductID, e.name, e.kind, e.platform, e.region, e.item.Quantity, e.price, encoded); err != nil {
			return "", err
		}
		if _, err = tx.Exec(ctx, `UPDATE products SET stock_quantity=stock_quantity-$2,updated_at=now() WHERE id=$1`, e.item.ProductID, e.item.Quantity); err != nil {
			return "", err
		}
	}
	if _, err = tx.Exec(ctx, `INSERT INTO order_events(order_id,status) VALUES($1,'PENDING')`, id); err != nil {
		return "", err
	}
	return id, tx.Commit(ctx)
}

const orderJSON = `to_jsonb(o) - 'idempotency_key' - 'request_hash' || jsonb_build_object('items',COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.name) FROM order_items i WHERE i.order_id=o.id),'[]'::jsonb),'events',COALESCE((SELECT jsonb_agg(jsonb_build_object('status',e.status,'created_at',e.created_at) ORDER BY e.id) FROM order_events e WHERE e.order_id=o.id),'[]'::jsonb))`

func (h *Handler) listOrders(c *gin.Context)      { h.orders(c, false) }
func (h *Handler) listAdminOrders(c *gin.Context) { h.orders(c, true) }
func (h *Handler) orders(c *gin.Context, admin bool) {
	rows, err := h.pool.Query(c.Request.Context(), `SELECT `+orderJSON+` || CASE WHEN $1 THEN jsonb_build_object('buyer_email',COALESCE((SELECT email FROM profiles WHERE id=o.user_id),'')) ELSE '{}'::jsonb END FROM orders o WHERE ($1 OR user_id=$2) ORDER BY created_at DESC LIMIT 100`, admin, auth.Current(c).ID)
	if err != nil {
		respondError(c, err)
		return
	}
	defer rows.Close()
	items := []json.RawMessage{}
	for rows.Next() {
		var item json.RawMessage
		if err := rows.Scan(&item); err != nil {
			respondError(c, err)
			return
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		respondError(c, rows.Err())
		return
	}
	c.JSON(200, gin.H{"items": items})
}
func (h *Handler) getOrder(c *gin.Context) {
	if !validOrderID(c) {
		return
	}
	var item json.RawMessage
	err := h.pool.QueryRow(c.Request.Context(), `SELECT `+orderJSON+` FROM orders o WHERE id=$1 AND user_id=$2`, c.Param("id"), auth.Current(c).ID).Scan(&item)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(200, item)
}
func (h *Handler) payOrder(c *gin.Context)    { h.transition(c, "COMPLETED") }
func (h *Handler) cancelOrder(c *gin.Context) { h.transition(c, "CANCELLED") }
func (h *Handler) transition(c *gin.Context, status string) {
	if !validOrderID(c) {
		return
	}
	expired, err := h.changeOrder(c.Request.Context(), c.Param("id"), auth.Current(c).ID, status)
	if err != nil {
		respondError(c, err)
		return
	}
	if expired {
		fail(c, 409, "order_expired")
		return
	}
	c.JSON(200, gin.H{"status": status})
}
func (h *Handler) changeOrder(ctx context.Context, id, user, target string) (bool, error) {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(context.Background())
	var status string
	var expiry time.Time
	err = tx.QueryRow(ctx, `SELECT status,expires_at FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE`, id, user).Scan(&status, &expiry)
	if err != nil {
		return false, err
	}
	if status == target {
		return false, nil
	}
	if status != "PENDING" {
		return false, businessError{"invalid_order_state"}
	}
	expired := !expiry.After(time.Now())
	if expired {
		target = "CANCELLED"
	}
	if target == "CANCELLED" {
		if err = releaseStock(ctx, tx, id); err != nil {
			return false, err
		}
	} else {
		// Deliberately non-redeemable, including multi-unit purchases.
		_, err = tx.Exec(ctx, `UPDATE order_items SET delivery_note=CASE WHEN product_type='GAME_KEY' THEN 'DEMO-NOT-VALID-' || id::text || ' (x' || quantity || ')' ELSE 'จำลองการเติมเกมสำเร็จ ไม่มีการเติมเงินจริง' END WHERE order_id=$1`, id)
		if err != nil {
			return false, err
		}
	}
	if _, err = tx.Exec(ctx, `UPDATE orders SET status=$2 WHERE id=$1`, id, target); err != nil {
		return false, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO order_events(order_id,status) VALUES($1,$2)`, id, target); err != nil {
		return false, err
	}
	return expired, tx.Commit(ctx)
}

func releaseStock(ctx context.Context, tx pgx.Tx, id string) error {
	rows, err := tx.Query(ctx, `SELECT product_id::text,quantity FROM order_items WHERE order_id=$1 ORDER BY product_id`, id)
	if err != nil {
		return err
	}
	type reservation struct {
		id       string
		quantity int
	}
	items := []reservation{}
	for rows.Next() {
		var i reservation
		if err := rows.Scan(&i.id, &i.quantity); err != nil {
			rows.Close()
			return err
		}
		items = append(items, i)
	}
	rows.Close()
	if rows.Err() != nil {
		return rows.Err()
	}
	for _, i := range items {
		if _, err := tx.Exec(ctx, `UPDATE products SET stock_quantity=stock_quantity+$2,updated_at=now() WHERE id=$1`, i.id, i.quantity); err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) ExpireOrders(ctx context.Context) error {
	rows, err := h.pool.Query(ctx, `SELECT id::text,user_id::text FROM orders WHERE status='PENDING' AND expires_at<=now() LIMIT 100`)
	if err != nil {
		return err
	}
	type expired struct{ id, user string }
	items := []expired{}
	for rows.Next() {
		var i expired
		if err := rows.Scan(&i.id, &i.user); err != nil {
			rows.Close()
			return err
		}
		items = append(items, i)
	}
	rows.Close()
	if rows.Err() != nil {
		return rows.Err()
	}
	for _, i := range items {
		if _, err := h.changeOrder(ctx, i.id, i.user, "CANCELLED"); err != nil {
			var business businessError
			if !errors.As(err, &business) {
				return err
			}
		}
	}
	return nil
}
