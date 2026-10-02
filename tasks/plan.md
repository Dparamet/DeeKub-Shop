# deeKub — Implementation Plan

วันที่: 2026-10-03
สถานะ: Phase 1 เริ่มแล้ว — Go API `/health` และ Web Store/CMS demo shell อยู่บน branch `feature/deekub-web-mvp`; PostgreSQL, auth, API integration และ flow ซื้อขายยังไม่เริ่ม

## Overview

สร้าง deeKub ร้าน Digital Product สำหรับขายแพ็กเติมเกมและ Game Key ในเว็บไซต์เดียว โดย MVP ทำ Web Store + CMS ให้ flow สั่งซื้อ, mock payment, mock top-up/key fulfillment และ order tracking ทำงานครบก่อน ส่วน Windows `.exe` และ Mobile เป็น Phase 2 และใช้ Go API เดิม

ตัวอย่างเกม, ราคา, ภาพปก, Order ID และ provider ที่แนบมาเป็นข้อมูล mock สำหรับหน้าจอเท่านั้น ยังไม่ใช่ supplier, ราคา หรือ inventory จริง

## Brand / Visual Direction

- Product: **deeKub**
- Dark UI เป็นหลัก; สีหลัก Purple/Blue, Cyan เป็น accent, Green ใช้เฉพาะสถานะสำเร็จ
- Card radius 12–16px; glow บาง ๆ ไม่ใช้ Neon จัด
- Font: Inter + Noto Sans Thai; เน้นภาพ Cover เกมขนาดใหญ่
- ภาพรวมต้องให้ความรู้สึกเป็นร้าน Digital Product จริง ไม่ใช่เว็บแฟนเกม
- Customer home: Header มี เกม / เติมเกม / Game Keys / โปรโมชั่น พร้อม search/account; Hero "ซื้อเกม / เติมเกมในที่เดียว"; สินค้าขายดีและเกมเติมยอดนิยม
- Product detail แยก 2 flow: Game Key แสดง platform/region/stock/ราคา/delivery; Top-up ให้เลือก package และกรอก Player ID/tag/region พร้อมเตือนให้ตรวจข้อมูล
- Order tracking ใช้ timeline และแสดงสถานะ/แนวทางเมื่อ provider error
- CMS ใช้ sidebar แบ่ง Dashboard, Catalog, Orders, Customers, Analytics และ System
- Dashboard เน้น Revenue, Orders, Completed, Failed, Recent Orders และกล่อง Action Required มากกว่ากราฟจำนวนมาก

## Architecture Decisions

| ส่วน | เทคโนโลยี | เหตุผล / Trade-off |
|---|---|---|
| Web + CMS | Next.js + TypeScript | เว็บหน้าร้านและ CMS ชุดเดียว; รองรับ public product pages/SEO; ต้องจัดการ server/client rendering |
| Backend | Go + Gin REST API | ผู้ใช้ต้องการเรียน Go; API กลางและ modular monolith; ช่วงเริ่มต้นช้ากว่า tech ที่คุ้น |
| Database | PostgreSQL + pgx/database/sql + SQL migrations | Transaction สำคัญกับ order/key reservation; ไม่เพิ่ม ORM ใน MVP |
| Auth | Supabase Auth | ลดงาน password/auth flows; Go API ตรวจ JWT และ role ทุก protected endpoint |
| Phase 1 hosting | Azure Container Apps สำหรับ Next.js และ Go API; Azure Database for PostgreSQL | ใช้ Azure Student credits และ custom domain; PostgreSQL มี metered compute/storage ต้องเฝ้าค่าใช้จ่าย |
| Phase 2 clients | Tauri 2 สำหรับ Windows `.exe`; React Native + Expo สำหรับ Mobile | เริ่มหลัง API และ customer order flow ผ่าน; ใช้ API/contract ชุดเดิม |
| Fulfillment | Mock Provider + internal Key Inventory | สร้าง demo ได้โดยไม่พึ่งเงินจริงหรือ provider ก่อนยืนยัน supply; ออกแบบ adapter ไว้เปลี่ยนเป็น provider ที่ได้รับอนุญาต |

### แผน Azure

- ใช้ `www.<domain>` สำหรับหน้า Web และ `api.<domain>` สำหรับ Go API; ตั้ง DNS และ HTTPS ตาม custom-domain flow ของ Azure Container Apps
- Azure for Students ที่ Microsoft แสดงในปัจจุบันมี USD 100 เครดิตอายุ 12 เดือนและ free service amounts บางรายการ; ตรวจ subscription, เครดิตคงเหลือ, region และราคาจริงก่อน provision
- Azure Container Apps Consumption มี free monthly grant ตาม quota; quota ใช้ร่วมกันระดับ subscription และ resource อื่นอาจมีค่าใช้จ่าย
- Azure Database for PostgreSQL Flexible Server คิดค่า compute/storage; ตั้ง budget alert และลบ/หยุด resource ทดสอบหลัง backup เมื่อไม่ใช้
- เก็บ payment/provider secrets ใน server-side secret configuration; ห้ามส่ง secret หรือ service role key ไป frontend

## Scope

### Phase 1 — Web Store + CMS (MVP)

**Customer**

- Login/Register
- ดูรายการสินค้าและรายละเอียด
- Game Key: ดูชื่อเกม, platform, region, stock, ราคา และ delivery; หลัง payment demo ยืนยันแล้วดู Key เฉพาะเจ้าของ order และ copy ได้
- Top-up: เลือก package, กรอก Riot ID/Tag/Region หรือ field ตามเกมแรกที่เลือก, ยืนยันก่อนสั่ง
- Mock checkout/payment
- Order history และ order timeline
- แสดง provider failure, สาเหตุที่สื่อสารได้, ติดต่อ Admin/ขอคืนเงิน (demo flow)

**CMS**

- Dashboard: Revenue, Orders, Completed, Failed, Recent Orders, Action Required
- Product CRUD, Top-up Package CRUD
- Game Key inventory: import/add, counts, status, masked list, authorized reveal พร้อม audit log
- Order/payment management และ failed order resolution
- User management และ role assignment แบบจำกัด Admin
- Mock Provider settings: Simulation mode, delay, success/failure setting และ Test Connection
- Sales/Reports แบบสรุป; ไม่ทำ analytics ซับซ้อน

**Out of MVP**

- Live payment, live top-up integration, real-money sales, multi-vendor, wallet, coupons
- Tauri Desktop, Mobile, App Store/Google Play billing
- Auto supplier onboarding, advanced analytics

### Phase 2 — Native clients

- ทำ Tauri Windows app และ React Native/Expo Mobile หลัง Web+CMS happy path, failure path, API contract และ auth เสถียร
- Clients เรียก Go API เดิม; ไม่ทำ business rules หรือกำหนด role ใน client
- Mobile checkout เปิดภายหลังทบทวนนโยบาย billing ตาม store, product type และประเทศ

## Domain Model

ตารางเสนอ: profiles, roles, games, products, topup_packages, orders, order_items, order_status_events, payments, payment_events, fulfillment_jobs, fulfillment_events, key_inventory, delivered_keys, audit_logs

- `products.type`: `topup` หรือ `game_key`; ข้อมูล region/platform และวิธี fulfillment แยกตามชนิด
- `orders`/`order_items` เก็บ snapshot ชื่อ, ราคา, currency และ region ตอนซื้อ; ราคาและ total คำนวณฝั่ง Go API; ใช้ integer minor units
- `topup_packages` เก็บ provider product mapping และ field schema ที่เกมต้องใช้; MVP ใช้เกมเดียวก่อน
- `key_inventory` เก็บ source/region/status และ encrypted key; list แสดง mask; Key plaintext ไม่อยู่ใน logs หรือ API response ของ list
- Key reservation ใช้ DB transaction/row lock เพื่อป้องกันการส่ง Key เดียวให้สอง order; จองก่อน reveal และเปลี่ยนเป็น sold เมื่อ fulfillment เสร็จ
- `order_status_events` เก็บ timeline ที่ตรวจย้อนหลังได้; payment status กับ fulfillment status แยกกัน
- Mock provider สร้างผลลัพธ์สำเร็จ/ล้มเหลว/หน่วงเวลาเพื่อทดสอบ dashboard และ support workflows

## Order State Machine

```text
PENDING_PAYMENT -> PAID -> PROCESSING -> COMPLETED
                                  └──> PROVIDER_FAILED -> REFUND_REQUESTED -> REFUNDED
```

- Key: หลัง `PAID` จอง stock แบบ atomic และ fulfill เป็น `COMPLETED`; ถ้า stock หมดให้เข้าคิวแก้ไข/คืนเงิน
- Top-up: หลัง `PAID` สร้าง fulfillment job; timeout ต้อง query/mock reconciliation ก่อน retry; retry ใช้ idempotency key
- Payment webhook ซ้ำต้องไม่ทำ fulfillment ซ้ำ; mock payment อยู่ใน development/demo เท่านั้นและปิดใน production config
- Order timeline แสดง label ภาษาไทย/อังกฤษที่เข้าใจง่าย ส่วน API เก็บ status code คงที่ เช่น `PROVIDER_FAILED`

## Roles & Security

- `USER`: ดู catalog, สร้าง order ของตน และดู status/key เฉพาะ order ที่ตนเป็นเจ้าของ
- `SUPPORT`: ดูและจัดการ failed order ตามขอบเขต; ไม่แก้ role/ราคา/provider secrets และไม่เห็น key เต็มจาก inventory list
- `ADMIN`: จัดการ catalog, inventory, provider simulation, users และ reports
- Go API ตรวจ JWT, ownership และ role ทุก endpoint สำคัญ; UI ซ่อนเมนูอย่างเดียวไม่ถือเป็น authorization
- Key view/admin reveal เขียน audit event; mask ใน table, จำกัดสิทธิ์และไม่เก็บ plaintext ใน telemetry
- Mock payment/provider routes ต้องป้องกันการเปิดใช้ใน production environment

## API Surface (Draft)

```text
GET    /products
GET    /products/{id}
GET    /orders
POST   /orders
GET    /orders/{id}
POST   /demo/payments/{orderId}/confirm
GET    /orders/{id}/key

GET    /admin/orders
PATCH  /admin/orders/{id}/resolve
POST   /admin/products
PATCH  /admin/products/{id}
POST   /admin/topup-packages
GET    /admin/keys
POST   /admin/keys/import
POST   /admin/keys/{id}/reveal
GET    /admin/providers/mock
PATCH  /admin/providers/mock
POST   /admin/providers/mock/test
```

`POST /demo/payments/...` ใช้เฉพาะ demo; production payment provider/webhook เป็นงานแยกหลังเลือกผู้ให้บริการและตรวจ policy แล้ว

## Risks / Mitigations

| ความเสี่ยง | วิธีลด |
|---|---|
| ไม่มี supplier ที่มีสิทธิ์ | MVP ใช้ mock provider และ key demo; ก่อนขายจริงต้องยืนยันสัญญา/สิทธิ์/region/เงื่อนไข refund |
| ส่งเติมซ้ำหลัง timeout | Idempotency, provider status reconciliation และ fulfillment event log |
| Key ซ้ำหรือรั่ว | Encryption, atomic reservation, mask, owner check, audit, ห้าม plaintext logs |
| Mock payment ถูกใช้จริง | แยก route/config และ fail startup หาก demo payment เปิดใน production |
| Support ดูข้อมูลเกินจำเป็น | Permission matrix สำหรับ USER/SUPPORT/ADMIN และ API tests |
| Azure credit หมด | Budget alert, ตรวจ cost estimate, scale-to-zero และ teardown resource demo |
| Scope บานจาก native apps | Phase 2 เริ่มหลัง Web+CMS acceptance ครบ |

## Checkpoints

1. Foundation: Next.js, Go API, PostgreSQL, auth/roles และ deploy dev/staging
2. Catalog: หน้า Home, product details, CMS CRUD และ game/top-up packages
3. Order + Payment: Mock checkout, order states และ timeline
4. Fulfillment + Admin: Key reservation/delivery, mock top-up, dashboard, provider/failure management
5. MVP review: USER/SUPPORT/ADMIN permissions, demo happy/failure paths และ Azure domain/HTTPS
6. Phase 2 entry: API/client contract ผ่านและผู้ใช้ทบทวนขอบเขตก่อนเริ่ม `.exe`/Mobile

## Open Decisions

1. เกมแรกที่จะทำ mock top-up คือเกมใด และต้องใช้ Player ID/Tag/Server/Region fields แบบใด?
2. Demo key จะใช้รูปแบบ placeholder อะไร และจะ seed รหัสทดสอบอย่างปลอดภัยอย่างไร?
3. เป้าหมาย/กำหนดส่ง และสถานะ Azure for Students/เครดิตคงเหลือ?
4. Windows/Mobile ใน Phase 2 ต้องเป็น customer apps หรือ admin apps?
5. สกุลเงิน/ภาษาเริ่มต้นเป็น THB/ไทย ใช่หรือไม่?

## Official References

- Steam Keys: https://partner.steamgames.com/doc/features/keys
- Go REST API with Gin: https://go.dev/doc/tutorial/web-service-gin
- Go database access: https://go.dev/doc/database/
- Azure for Students: https://learn.microsoft.com/en-us/azure/education-hub/about-azure-for-students
- Azure Container Apps billing: https://learn.microsoft.com/en-us/azure/container-apps/billing
- Azure Container Apps custom domains: https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-certificates
- Azure PostgreSQL compute: https://learn.microsoft.com/en-us/azure/postgresql/compute-storage/concepts-compute
- Google Play payment policy: https://support.google.com/googleplay/android-developer/answer/10281818?hl=en
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
