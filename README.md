# deeKub

ร้าน Digital Product สำหรับซื้อ Game Key และเติมเกมจากเว็บไซต์เดียว วางระบบให้แยกวิธีส่งมอบสินค้าแต่ละประเภท และให้ Admin ติดตามออเดอร์ผิดพลาดได้

> **สถานะ:** Phase 1 กำลังพัฒนา — Go API มี `/health`, `/readyz`, public catalog API และ PostgreSQL migration/seed; Web Store/CMS ยังใช้ข้อมูล demo และยังไม่เชื่อม API ไม่มี Auth, checkout, การชำระเงินจริง หรือ provider จริง

## เป้าหมาย

ส่งมอบ flow สำหรับร้านเกมที่ตรวจสอบได้ตั้งแต่เลือกสินค้า → สร้างออเดอร์ → จำลองการชำระเงิน → ส่ง Game Key หรือจำลองการเติมเกม → ติดตามสถานะและแก้ปัญหาจาก CMS

## MVP Features

### Customer Web

- สมัคร/เข้าสู่ระบบ และค้นหาหรือเลือกเกม
- ดูสินค้าแยกเป็น Game Key และแพ็ก Top-up
- Game Key แสดง platform, region, ราคา และสถานะ stock
- Top-up เลือกแพ็กเกจและกรอก Player ID, Tag, Server/Region ตามเกม
- Mock checkout, ประวัติออเดอร์ และ timeline สถานะ
- แสดง Game Key เฉพาะเจ้าของออเดอร์ที่ชำระแล้ว
- แสดงความผิดพลาดจากการเติม พร้อมช่องทางติดต่อ Admin/ขอคืนเงินสำหรับ demo

### Admin CMS

- Dashboard แสดง Revenue, Orders, Completed, Failed, Recent Orders และ Action Required
- จัดการสินค้าและ Top-up packages
- นำเข้า/เพิ่ม Game Keys และดู Available/Reserved/Sold
- ปิดบัง Key ในตาราง; จำกัดการเปิดดูและบันทึก audit event
- จัดการออเดอร์ที่ล้มเหลว, ผู้ใช้ และการจำลอง Provider

## Product Flows

1. **Game Key:** ชำระเงินสำเร็จ → จองรหัสใน stock แบบ atomic → ให้เจ้าของออเดอร์เปิดดูรหัสได้
2. **Top-up:** ชำระเงินสำเร็จ → สร้าง fulfillment job → Mock Provider จำลองสำเร็จ/ล้มเหลว/timeout → แสดง timeline ให้ลูกค้าและ Admin

ใน MVP หนึ่งออเดอร์มีสินค้าชนิดเดียว เพื่อลดกรณี Top-up สำเร็จแต่ Key ล้มเหลวในตะกร้าเดียว

## Technology Stack

| Layer | Technology |
|---|---|
| Web Store + CMS | Next.js, TypeScript, Tailwind CSS |
| Backend API | Go, Gin, REST |
| Database | PostgreSQL, pgx/database/sql, SQL migrations |
| Authentication | Supabase Auth; Go API ตรวจ JWT, role และ ownership |
| Hosting | Azure Container Apps + Azure Database for PostgreSQL |
| Phase 2 Desktop | Tauri 2 (`.exe`) |
| Phase 2 Mobile | React Native + Expo |

Frontend ไม่มีสิทธิ์กำหนดราคา สถานะชำระเงิน หรือ role เอง; Go API ตรวจสิทธิ์และเป็นแหล่งความจริงของคำสั่งซื้อ

## UI Direction

- ชื่อแบรนด์: **deeKub**
- Dark UI; Purple/Blue เป็นสีหลัก, Cyan เป็น accent, Green ใช้เฉพาะสถานะสำเร็จ
- Card radius 12–16px, glow เล็กน้อย, ฟอนต์ Inter และ Noto Sans Thai
- เน้นภาพปกเกม และออกแบบให้เหมือนร้าน Digital Product จริง
- Game Key และ Top-up มีรายละเอียดและแบบฟอร์มแยกกัน

## Architecture & Roadmap

- **Phase 1:** Next.js Web Store + CMS, Go API, PostgreSQL และ Azure staging
- **Phase 2:** Windows Desktop ด้วย Tauri และ Mobile ด้วย Expo โดยใช้ Go API เดิม
- แผนละเอียดและ acceptance criteria: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)

## Run API Locally

ต้องมี Go 1.25 ขึ้นไปและ Docker Desktop ที่เปิด Docker Engine แล้ว

```powershell
docker compose up -d postgres

Set-Location apps/api
$env:DATABASE_URL = "postgres://deekub:local-only-change-me@localhost:5432/deekub?sslmode=disable"
go run ./cmd/migrate
go run ./cmd/server
```

`.env.example` ระบุค่า local development; Compose ใช้ค่าเริ่มต้นเดียวกันเมื่อยังไม่มี `.env` ไฟล์นี้ใช้เฉพาะเครื่อง local และห้ามนำรหัสผ่านตัวอย่างไป deploy

API endpoints ปัจจุบัน:

```text
GET /health                 # liveness; ไม่ตรวจ DB
GET /readyz                 # readiness; ต้องเชื่อม PostgreSQL ได้
GET /products               # รายการสินค้าที่ publish แล้ว
GET /products?type=TOPUP    # กรอง TOPUP หรือ GAME_KEY
GET /products?q=valorant    # ค้นชื่อเกม/สินค้า
GET /products/{slug}        # รายละเอียดสินค้าตาม slug
```

ตรวจ endpoint และ Go checks จากอีก terminal:

```powershell
Set-Location apps/api
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/readyz
Invoke-RestMethod http://localhost:8080/products
go test ./...
go vet ./...
```

ข้อมูลสินค้าเริ่มต้นเป็น seed สำหรับ demo เท่านั้น; Web ยังอ่าน catalog จากข้อมูล demo ใน frontend ไม่ได้เรียก API

## Run Web Locally

ต้องมี Node.js 20.9 ขึ้นไป และ npm

```powershell
Set-Location apps/web
npm ci
npm run dev
```

เปิด `http://localhost:3000` สำหรับหน้าร้าน และ `http://localhost:3000/admin` สำหรับ CMS dashboard ตัวอย่าง; ค้นหา/กรองสินค้า, เปิดรายละเอียดแยก Top-up กับ Game Key และดูตะกร้า demo ได้ แต่ยังไม่มี login, checkout หรือ API integration

ตรวจคุณภาพก่อนส่งงาน:

```powershell
npm run lint
npm run typecheck
npm run build
```

## Safety and Supply Requirements

- Mock Payment/Mock Provider ใช้ใน local/demo เท่านั้น; ห้ามเปิดใช้กับ production
- ก่อนขายจริง ต้องยืนยันผู้ให้บริการ Top-up และแหล่ง Game Key ที่ได้รับอนุญาต รวมถึงภูมิภาคและเงื่อนไขคืนเงิน
- Steam Keys ต้องมีแหล่งจัดซื้อ/สิทธิ์จำหน่ายที่เหมาะสม; อย่าสมมติว่า Steam เป็น wholesaler สำหรับร้านทั่วไป
- ตั้ง budget alert ก่อนสร้าง Azure resources; ตรวจค่า compute/storage และเครดิตคงเหลือ

## Next Steps

1. เชื่อม Web catalog กับ Go API และทำ CMS catalog CRUD พร้อม Auth/roles
2. ทำ vertical slices: order → mock payment → fulfillment → CMS operations
3. Deploy staging และผูกโดเมนเมื่อเลือก Azure resources, ตั้ง spending alert และมี remote พร้อม
