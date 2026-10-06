# deeKub

ร้าน Digital Product สำหรับซื้อ Game Key และเติมเกมจากเว็บไซต์เดียว วางระบบให้แยกวิธีส่งมอบสินค้าแต่ละประเภท และให้ Admin ติดตามออเดอร์ผิดพลาดได้

> **สถานะตอนนี้:** เว็บเรียก catalog ผ่าน Go API ที่อ่านจาก PostgreSQL ได้. Migration แรกสร้างตาราง `products` และเพิ่มสินค้า demo 6 รายการ. `/admin` ยังเป็น preview; login/roles, จัดการสินค้า, orders, checkout และ payment จริงยังไม่ทำ

## เป้าหมาย

ส่งมอบ flow สำหรับร้านเกมที่ตรวจสอบได้ตั้งแต่เลือกสินค้า → สร้างออเดอร์ → จำลองการชำระเงิน → ส่ง Game Key หรือจำลองการเติมเกม → ติดตามสถานะและแก้ปัญหาจาก CMS

## Planned MVP Features

หัวข้อต่อไปนี้เป็นเป้าหมายของ MVP; ฟีเจอร์ที่ยังไม่อยู่ในสถานะด้านบนยังไม่ได้พัฒนา

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

## Planned Product Flows

1. **Game Key:** ชำระเงินสำเร็จ → จองรหัสใน stock แบบ atomic → ให้เจ้าของออเดอร์เปิดดูรหัสได้
2. **Top-up:** ชำระเงินสำเร็จ → สร้าง fulfillment job → Mock Provider จำลองสำเร็จ/ล้มเหลว/timeout → แสดง timeline ให้ลูกค้าและ Admin

ใน MVP หนึ่งออเดอร์มีสินค้าชนิดเดียว เพื่อลดกรณี Top-up สำเร็จแต่ Key ล้มเหลวในตะกร้าเดียว

## Technology Stack

| Layer | Technology |
|---|---|
| Web Store + CMS | Next.js, TypeScript, Tailwind CSS |
| Backend API | Go, Gin, REST |
| Database | Supabase PostgreSQL, pgx, SQL migrations |
| Authentication | Supabase Auth (planned; not implemented) |
| Hosting | ยังไม่กำหนด |
| Phase 2 Desktop | Tauri 2 (`.exe`) |
| Phase 2 Mobile | React Native + Expo |

เมื่อเพิ่ม order flow, Go API จะเป็นส่วนที่คำนวณราคาและตรวจสิทธิ์ ไม่ให้ frontend กำหนดยอดหรือ role เอง

## UI Direction

- ชื่อแบรนด์: **deeKub**
- Dark UI; Purple/Blue เป็นสีหลัก, Cyan เป็น accent, Green ใช้เฉพาะสถานะสำเร็จ
- Card radius 12–16px, glow เล็กน้อย, ฟอนต์ Inter และ Noto Sans Thai
- เน้นภาพปกเกม และออกแบบให้เหมือนร้าน Digital Product จริง
- Game Key และ Top-up มีรายละเอียดและแบบฟอร์มแยกกัน

## Architecture & Roadmap

- **Phase 1:** Next.js Web Store, Go API, Supabase PostgreSQL, Auth/roles และ order flow
- **Phase 2:** Windows Desktop ด้วย Tauri และ Mobile ด้วย Expo โดยใช้ Go API เดิม
- Production hosting ยังไม่กำหนด
- แผนละเอียดและ acceptance criteria: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)

## Connect Supabase and Run Locally

ต้องมี Go 1.25 ขึ้นไป, Node.js 20.9 ขึ้นไป, npm และ Supabase project

### ตั้งค่า `.env`

1. คัดลอก `.env.example` เป็น `.env` ที่โฟลเดอร์หลัก ซึ่งอยู่ระดับเดียวกับ `package.json`
2. ใน Supabase กด **Connect → Session pooler** แล้วคัดลอก URI
3. วาง URI หลัง `DATABASE_URL=` ใน `.env` และแทน `[YOUR-PASSWORD]` ด้วยรหัสผ่านฐานข้อมูล โดยไม่ใส่วงเล็บ

```env
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<POOLER_HOST>:5432/postgres
PORT=8080
DEEKUB_API_URL=http://localhost:8080
```

ใช้ URI จาก Supabase ตามที่ให้มา อย่าประกอบ host หรือ username เอง. ถ้ารหัสผ่านมีอักขระพิเศษ ให้ percent-encode ก่อนใส่ใน URI. ห้ามส่ง `DATABASE_URL` หรือ commit ไฟล์ `.env`; `.gitignore` กันไฟล์นี้ไว้แล้ว

`DATABASE_URL` ใช้กับ Go API เพื่อเชื่อม PostgreSQL. `anon public`/publishable key ไม่ใช้กับ migration นี้; Supabase Auth ยังไม่ได้เชื่อม

### Terminal 1: migration และ Go API

เปิด PowerShell ที่โฟลเดอร์หลักของ repository แล้วรัน:

```powershell
$line = Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $line -or $line -eq 'DATABASE_URL=') { throw 'ใส่ DATABASE_URL ใน .env ก่อน' }
$env:DATABASE_URL = $line.Substring('DATABASE_URL='.Length)
$line = Get-Content .env | Where-Object { $_ -match '^PORT=' } | Select-Object -First 1
if ($line) { $env:PORT = $line.Substring('PORT='.Length) }
Set-Location apps/api
go run ./cmd/migrate
go run ./cmd/server
```

ทำ migration ครั้งแรก หรือเมื่อมี migration ใหม่เท่านั้น. Migration แรกสร้างตารางและเพิ่มสินค้า demo 6 รายการ. รอข้อความ `database migrations applied` ก่อน; จากนั้น API จะทำงานใน terminal นี้

### Terminal 2: เว็บ

เปิด PowerShell อีกหน้าต่างที่โฟลเดอร์หลัก แล้วรัน:

```powershell
$line = Get-Content .env | Where-Object { $_ -match '^DEEKUB_API_URL=' } | Select-Object -First 1
if ($line) { $env:DEEKUB_API_URL = $line.Substring('DEEKUB_API_URL='.Length) }
npm install
npm run dev
```

ใช้ `npm install` ครั้งแรกหรือเมื่อ dependencies เปลี่ยน. เปิด `http://localhost:3000` สำหรับหน้าร้าน และ `http://localhost:3000/admin` สำหรับ Admin preview

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

Storefront และหน้า Catalog ใน `/admin` อ่านข้อมูลผ่าน Next.js route `/api/catalog` ไปยัง Go API. ถ้า API ไม่พร้อม เว็บจะแสดง catalog demo พร้อมสถานะและปุ่มโหลดใหม่

### Admin preview (`/admin`)

- Dashboard คำนวณยอดส่งมอบสำเร็จ จำนวนออเดอร์ และรายการรอตรวจสอบจากข้อมูล demo ชุดเดียวกับตาราง
- เมนูภาพรวม สินค้าและแพ็กเกจ คำสั่งซื้อ และคลัง Key; รองรับหน้าจอมือถือ
- Catalog แสดงสินค้าที่เผยแพร่จาก API ค้นหา/กรอง Top-up หรือ Game Key และเปิดดู platform, region, การส่งมอบ และช่องข้อมูลผู้เล่น
- ออเดอร์ demo ค้นหา/กรองสถานะ เปิดรายละเอียด และส่งออก `deekub-demo-orders.csv` ตามตัวกรองปัจจุบัน
- คลัง Key เป็นข้อมูลสรุปจำลอง ไม่มีรหัสจริง และยังไม่มีการเพิ่ม/แก้ไขสินค้า นำเข้า Key หรือเปลี่ยนสถานะออเดอร์

`/admin` ยังเป็นหน้า preview ที่เปิดได้โดยไม่มี Auth ใช้เฉพาะ catalog สาธารณะและข้อมูลจำลอง ต้องเพิ่มการตรวจ ADMIN/SUPPORT ฝั่ง Go API ก่อนต่อข้อมูลหรือคำสั่งจัดการจริง การตั้ง `noindex` ไม่ใช่การควบคุมสิทธิ์

ตรวจคุณภาพเมื่อต้องการ:

```powershell
npm run lint
npm run typecheck
npm run build
```

## Safety and Supply Requirements

- Mock Payment/Mock Provider ใช้ใน local/demo เท่านั้น; ห้ามเปิดใช้กับ production
- ก่อนขายจริง ต้องยืนยันผู้ให้บริการ Top-up และแหล่ง Game Key ที่ได้รับอนุญาต รวมถึงภูมิภาคและเงื่อนไขคืนเงิน
- Steam Keys ต้องมีแหล่งจัดซื้อ/สิทธิ์จำหน่ายที่เหมาะสม; อย่าสมมติว่า Steam เป็น wholesaler สำหรับร้านทั่วไป
- ก่อนเปิด production ให้ตรวจค่าใช้จ่ายและตั้ง budget alert ของ hosting ที่เลือก

## Next Steps

1. ทำ CMS catalog CRUD พร้อม Auth/roles และซิงก์การเผยแพร่สินค้า
2. ทำ vertical slices: order → mock payment → fulfillment → CMS operations
3. เตรียม staging หลังเลือก hosting และตั้ง budget alert
