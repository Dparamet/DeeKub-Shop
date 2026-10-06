ALTER TABLE products ADD COLUMN stock_quantity integer NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0);

CREATE TABLE profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    payment_mode text NOT NULL DEFAULT 'MOCK' CHECK (payment_mode = 'MOCK'),
    total_minor bigint NOT NULL CHECK (total_minor >= 0),
    currency text NOT NULL DEFAULT 'THB' CHECK (currency = 'THB'),
    idempotency_key text NOT NULL,
    request_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
    UNIQUE (user_id, idempotency_key)
);
CREATE INDEX orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX orders_pending_expiry_idx ON orders(expires_at) WHERE status = 'PENDING';

CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    name text NOT NULL,
    product_type text NOT NULL,
    platform text NOT NULL,
    region text NOT NULL,
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
    account_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
    delivery_note text NOT NULL DEFAULT ''
);
CREATE INDEX order_items_order_idx ON order_items(order_id);

CREATE TABLE order_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- All business data goes through Go, which enforces ownership and database roles.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON products, profiles, orders, order_items, order_events, schema_migrations FROM anon, authenticated;
