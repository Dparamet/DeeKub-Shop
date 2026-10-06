# deeKub

ร้าน Game Key และเติมเกม ใช้ Next.js + Go API + Supabase Auth/PostgreSQL

> โหมดทดลอง: บันทึกบัญชี สินค้า และคำสั่งซื้อจริงในฐานข้อมูล แต่ชำระเงินและส่งมอบแบบจำลอง ไม่มีการรับเงินจริง ไม่มี Game Key ที่ใช้ได้จริง และไม่เรียกผู้ให้บริการเติมเกม

## ฟีเจอร์ปัจจุบัน

### หน้าร้าน

- Light/Dark mode: ปุ่มดวงอาทิตย์/ดวงจันทร์บนเมนูหน้าร้านและ Admin จำค่าที่เลือกในอุปกรณ์ เริ่มต้นตามธีมเครื่อง
- ค้นหา กรองประเภท/แพลตฟอร์ม/ภูมิภาค/ราคา และเรียงสินค้า
- หน้ารายละเอียด ราคา สต็อก และข้อมูลบัญชีเกมสำหรับ Top-up
- ภาพเกมจริงจากเว็บไซต์ผู้พัฒนา/หน้าร้านทางการ พร้อมคำอธิบาย วิธีใช้ และลิงก์ตรวจข้อมูลต้นทาง
- Catalog ตัวอย่าง 29 รายการจาก 18 เกม รวม Roblox Gift Cards, Free Fire, PUBG MOBILE, Mobile Legends, Star Rail, Zenless Zone Zero และ Steam Keys
- ตะกร้าและรายการที่บันทึกเก็บในอุปกรณ์ผ่าน localStorage
- สมัคร/เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน ยืนยันอีเมล ส่งลิงก์ยืนยันอีกครั้ง ออกจากระบบ และรีเซ็ตรหัสผ่านผ่าน Supabase Auth
- สร้างคำสั่งซื้อหลังล็อกอิน ดูประวัติ รายละเอียด และ timeline ของตนเอง ค้นหาเลขคำสั่งซื้อ/สินค้าและกรองสถานะได้
- ชำระเงินจำลองหรือยกเลิกคำสั่งซื้อ คำสั่งซื้อค้างหมดอายุใน 30 นาที

### ผู้ดูแล

- เข้าโดยพิมพ์ `/admin` ไม่มีลิงก์ Admin ในเมนูหน้าร้าน
- ต้องล็อกอินด้วยบัญชีที่มี role `ADMIN` ในฐานข้อมูล ทั้งเว็บและ API ตรวจสิทธิ์
- เพิ่ม/แก้ไขสินค้า ราคา สต็อก ฟิลด์บัญชีเกม และเผยแพร่/ซ่อนสินค้า
- แก้ URL ภาพเกม เว็บไซต์ทางการ และคำแนะนำการเปิดใช้จากฟอร์มสินค้าได้ รองรับเฉพาะโดเมนภาพที่กำหนด
- ดูคำสั่งซื้อและข้อมูลที่ใช้เติมเกม 100 รายการล่าสุด ค้นหาเลขคำสั่งซื้อ/สินค้า/อีเมลผู้ซื้อ และกรองสถานะ
- การแก้ไขสินค้าตรวจเวอร์ชัน ป้องกันบันทึกทับราคา/สต็อกที่เปลี่ยนระหว่างเปิดฟอร์ม

Go คำนวณยอดด้วยหน่วยสตางค์ ตรวจราคาที่ผู้ซื้อเห็นและข้อมูลบัญชีเกม จองสต็อกใน transaction และกันคำขอสั่งซื้อซ้ำด้วย idempotency key ไม่รับ role หรือยอดรวมจากหน้าเว็บเป็นข้อมูลอ้างอิง

## เริ่มใช้งานในเครื่อง

ต้องมี **Node.js 20.9+**, npm, **Go 1.25+** และ Supabase project

เปิด PowerShell ที่โฟลเดอร์หลัก ซึ่งมี `package.json`:

```powershell
Set-Location "C:\Users\Acer\Desktop\Project My Future\Ebook Shop"
npm install
```

### 1. ตั้งค่า `.env` ที่เดียว

ถ้ามี `.env` อยู่แล้วให้แก้ไฟล์เดิม หากยังไม่มีให้คัดลอก `.env.example` เป็น `.env` ที่โฟลเดอร์หลัก

```text
Ebook Shop/
├── .env               ← ใส่ค่าจริงที่นี่ (ห้าม commit)
├── .env.example       ← ตัวอย่าง ไม่มีรหัสจริง
├── package.json
├── scripts/run.mjs    ← อ่าน .env และเปิดระบบ
└── apps/
    ├── api/           ← Go backend
    └── web/           ← Next.js frontend
```

```env
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<ENCODED_PASSWORD>@<SESSION_POOLER_HOST>:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_OR_ANON_KEY>
PORT=8080
DEEKUB_API_URL=http://localhost:8080
WEB_PORT=3000
APP_ENV=development
```

| ค่า | หาได้จาก | ใช้ทำอะไร |
|---|---|---|
| `DATABASE_URL` | Supabase > Connect > Session pooler > URI | Go เชื่อม PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Connect > Framework หรือ Data API | ติดต่อ Supabase Auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings > API Keys | publishable key หรือ legacy `anon public` สำหรับ Auth |
| `PORT` | กำหนดเอง ค่าเริ่มต้น 8080 | พอร์ต Go API |
| `DEEKUB_API_URL` | ตามพอร์ต API ด้านบน | Next.js ติดต่อ Go |
| `WEB_PORT` | กำหนดเอง ค่าเริ่มต้น 3000 | พอร์ตเว็บ |

คัดลอก URI จาก dashboard ตามจริง แล้วแทน `[YOUR-PASSWORD]` ด้วยรหัสผ่าน **ฐานข้อมูล** โดยไม่ใส่ `[]` ถ้ามีอักขระพิเศษให้ percent-encode เฉพาะรหัสผ่าน ใช้ Session pooler สำหรับเครือข่าย IPv4

ห้ามใช้ `service_role` หรือ `sb_secret_...` ในตัวแปร `NEXT_PUBLIC_*` ไม่ต้องใส่ JWT secret รหัสผ่านฐานข้อมูลไม่ใช่รหัสล็อกอินลูกค้า

คำสั่งที่โฟลเดอร์หลักโหลด `.env` อัตโนมัติและใช้ค่าจากไฟล์นี้ก่อน `.env.local` เดิม ไม่ต้องสร้าง `.env` ซ้ำใน `apps` หรือคัดลอกรหัสใส่คำสั่ง PowerShell

### 2. ตั้งค่า Supabase Auth

ใน Supabase ไป **Authentication > URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** เพิ่ม `http://localhost:3000/auth/callback`
- ถ้าเปลี่ยน `WEB_PORT` ให้ใช้พอร์ตนั้นทั้งสองค่า (เช่น 3001)
- เปิดผู้ให้บริการ Email ในหน้า Providers/Sign In และตั้งรหัสผ่านขั้นต่ำ 8 ตัวอักษร
- หากเปิด Confirm email ให้ผู้สมัครเปิดลิงก์ยืนยันในเบราว์เซอร์เดียวกับที่สมัครก่อนล็อกอิน

การสมัครและรีเซ็ตรหัสผ่านใช้การส่งอีเมลของ Supabase ซึ่งมี rate limit ต้องตั้ง SMTP ก่อนเปิดใช้กับลูกค้าจริง

หากสมัครไม่สำเร็จ ให้ดูข้อความแจ้งผลบนเว็บ:

- ส่งอีเมลถึงขีดจำกัด: รอแล้วส่งใหม่ตาม [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- ระบบส่งอีเมลให้ไม่ได้: ตรวจการตั้งค่า SMTP และข้อจำกัดผู้รับของผู้ให้บริการ ตาม [Supabase Auth error codes](https://supabase.com/docs/guides/auth/debugging/error-codes)
- ยังไม่ได้ยืนยัน: ที่ `/login` เลือก **ส่งอีเมลยืนยันอีกครั้ง** กรอกอีเมล แล้วเปิดลิงก์ในเบราว์เซอร์เดียวกัน

ต้องมีบัญชีใน **Supabase > Authentication > Users** จึงกำหนด Admin ได้ การใช้บัญชีเข้า Supabase Dashboard ไม่ได้สร้างบัญชีลูกค้า deeKub

### 3. สร้างตารางและเปิดระบบ

```powershell
npm run db:migrate
npm run dev
```

`db:migrate` สำรองข้อมูลแอปเดิมไว้ใน `apps/api/.cache/backups/` ก่อนเพิ่ม schema ทำครั้งแรกและเมื่อมี migration ใหม่ SQL แต่ละไฟล์ทำใน transaction และบันทึกเวอร์ชันเพื่อไม่รันซ้ำ

`npm run dev` เปิด Go API และ Next.js ใน terminal เดียว:

- หน้าร้าน: [http://localhost:3000](http://localhost:3000)
- บัญชี/ประวัติ: [http://localhost:3000/account](http://localhost:3000/account)
- ผู้ดูแล: [http://localhost:3000/admin](http://localhost:3000/admin)
- API readiness: [http://localhost:8080/readyz](http://localhost:8080/readyz)

หยุดด้วย **Ctrl+C** หากมีเซิร์ฟเวอร์เดิมเปิดอยู่ ให้หยุด terminal เดิมก่อนเริ่มคำสั่งนี้

### 4. กำหนด Admin คนแรก

1. เปิด `/signup` สมัครด้วยอีเมล/รหัสผ่าน และยืนยันอีเมลถ้าเปิด Confirm email
2. ใน terminal อีกหน้าที่โฟลเดอร์หลัก รันโดยเปลี่ยนอีเมลเป็นบัญชีที่สมัครจริง:

```powershell
npm run admin:grant -- your-email@example.com
```

3. เข้า `/admin` และล็อกอินด้วยอีเมล/รหัสผ่านบัญชี deeKub นั้น

คำสั่งนี้ใช้สิทธิ์ฐานข้อมูลในเครื่องเท่านั้น ไม่เปิดเป็น API ไม่ตั้ง Admin จากข้อมูลที่ลูกค้าส่งมา หากยังไม่สมัครหรือยังไม่ยืนยันอีเมล คำสั่งจะปฏิเสธ

## ลองใช้งาน flow หลัก

1. สมัคร/ล็อกอิน จากนั้นเลือกสินค้าที่มีสต็อก
2. สำหรับ Top-up กรอก UID/ID/Server ให้ครบ ห้ามกรอกรหัสผ่านเกม
3. เพิ่มลงตะกร้า ตรวจแพลตฟอร์ม/ภูมิภาค/จำนวน แล้วสร้างคำสั่งซื้อ
4. ในหน้าคำสั่งซื้อ กด **ยืนยันชำระเงินจำลอง** หรือ **ยกเลิกคำสั่งซื้อ**
5. ตรวจผลและ timeline ใน `/account`; Game Key ที่แสดงขึ้นต้น `DEMO-NOT-VALID-` ใช้จริงไม่ได้
6. Admin ตรวจคำสั่งซื้อใน `/admin/orders` และแก้ไขสินค้าใน `/admin`

สต็อกเริ่มต้น 100 ต่อสินค้า seed เป็นความจุสำหรับโหมดจำลอง ไม่ใช่จำนวน Key จากผู้จำหน่ายจริง

ราคาของ catalog เป็นราคาสำหรับทดลองร้าน ไม่ใช่ราคาเสนอขายจาก Steam หรือผู้ให้บริการเติมเกม Roblox ในชุดนี้เป็น Gift Card จำลอง ไม่กำหนดว่าเงินจำนวนหนึ่งจะได้ Robux เท่าไร เงื่อนไขบัตรและเครดิตต้องตรวจจาก Roblox เมื่อเชื่อมผู้จำหน่ายจริง

ภาพโหลดจาก CDN ของ Steam, Google Play, Roblox, Riot และ PUBG MOBILE โดยตรง มีภาพสำรองและข้อความแจ้งเมื่อโหลดไม่ได้ ภาพและชื่อเกมเป็นของเจ้าของผลงาน ไม่ใช่หลักฐานว่าร้านเป็นผู้จำหน่ายที่ได้รับอนุญาต แหล่งข้อมูลของแต่ละเกมเปิดดูได้ในหน้ารายละเอียดสินค้า และบันทึกไว้ใน [catalog sources](docs/catalog-sources.md)

## คำสั่ง

| คำสั่งจากโฟลเดอร์หลัก | หน้าที่ |
|---|---|
| `npm run dev` | เปิด API + เว็บ พร้อมโหลด root env |
| `npm run dev:web` | เปิดเฉพาะเว็บ |
| `npm run dev:api` | compile และเปิดเฉพาะ API |
| `npm run db:migrate` | สำรองข้อมูลแอปและรัน migrations |
| `npm run admin:grant -- EMAIL` | ให้ role ADMIN กับบัญชีที่ยืนยันอีเมลแล้ว |
| `npm run build` | build เว็บ |
| `npm run start` | เปิดเว็บที่ build แล้ว (เปิด API แยกด้วย `dev:api`) |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm run lint` | ตรวจ ESLint |

## API และสิทธิ์

เว็บใช้ `/api/catalog` สำหรับ catalog และ `/api/shop/*` เป็นตัวกลางไป Go พร้อม bearer token การเขียนข้อมูลตรวจ same-origin ทุกครั้ง

| Go endpoint | สิทธิ์ |
|---|---|
| `GET /health`, `GET /readyz` | สาธารณะ |
| `GET /products`, `GET /products/:slug` | สาธารณะ เฉพาะสินค้าที่เผยแพร่ |
| `GET /me` | ล็อกอิน |
| `GET /orders`, `POST /orders` | ล็อกอิน อ่าน/สร้างของตนเอง |
| `GET /orders/:id` | เจ้าของคำสั่งซื้อ |
| `POST /orders/:id/mock-payment`, `POST /orders/:id/cancel` | เจ้าของคำสั่งซื้อ |
| `GET/POST /admin/products`, `PUT /admin/products/:id` | ADMIN |
| `GET /admin/orders` | ADMIN |

Go ส่ง token ไปให้ Supabase Auth ตรวจ แล้วอ่าน role จาก `profiles` ทุกครั้ง RLS เปิดบนตารางแอปและไม่อนุญาต `anon`/`authenticated` อ่านเขียนผ่าน Data API โดยตรง Go เชื่อมด้วย database URL และต้องตรวจเจ้าของข้อมูลเอง

## โครงสร้างโค้ด

```text
apps/api/
  cmd/                 server, migrate, admin bootstrap
  internal/auth/       ตรวจ Supabase session และ role
  internal/catalog/    อ่านสินค้าสาธารณะ
  internal/shop/       admin products, orders, stock และ mock payment
  internal/db/         pool, backup และ migrations
apps/web/
  app/                 หน้าเว็บ, route handlers, CSS
  components/          หน้าร้าน, auth, cart, orders และ admin
  lib/                 Supabase SSR, API bridge และรูปแบบข้อมูล
  data/catalog.ts      ประเภทข้อมูลสินค้าและตัวช่วยราคา
scripts/run.mjs        คำสั่งเริ่มระบบจาก root
docs/                  design และ implementation plan
```

## แก้ปัญหา

| อาการ | วิธีแก้ |
|---|---|
| `hostname resolving error` ของ `db.*.supabase.co` | เปลี่ยนเป็น URI ของ Session pooler |
| `password authentication failed` | ตรวจรหัสผ่านฐานข้อมูลและ percent-encoding แล้วรันคำสั่งใหม่ |
| เชื่อม catalog ไม่ได้ | เปิด API ตรวจ `/readyz` และ `DEEKUB_API_URL` |
| ตาราง/column ไม่พบ | `npm run db:migrate` แล้วเปิด API ใหม่ |
| สมัครแล้วเข้าไม่ได้ | ยืนยันอีเมล ตรวจ Spam และ Supabase Auth settings |
| ลิงก์ยืนยัน/รีเซ็ตกลับผิดหน้า | ตรวจ Site URL, Redirect URLs และพอร์ตที่เปิดจริง |
| ไม่มีสิทธิ์ Admin | สมัคร/ยืนยันอีเมล แล้วใช้ `admin:grant` กับอีเมลนั้น |
| `account email not found in this Supabase project` | ตรวจว่าใช้บัญชีที่สมัครบน `/signup` ของ deeKub แล้ว ใน Supabase > Authentication > Users ต้องมีอีเมลนั้น บัญชีที่ใช้เข้า Supabase Dashboard เป็นคนละระบบกับบัญชีลูกค้า |
| `Another next dev server is already running` | Ctrl+C ที่ terminal เดิม แล้วเริ่มใหม่จาก root |
| ราคา/สต็อกเปลี่ยนระหว่างซื้อหรือแก้ไข | โหลดรายการใหม่และตรวจค่าก่อนยืนยันอีกครั้ง |

## ขอบเขตที่ยังไม่รวม

ยังไม่มี payment gateway, Key inventory จริง, top-up provider, webhook, refunds, deployment หรือการส่งอีเมลใบเสร็จ การชำระเงินจำลองเป็นโหมดเดียวของโปรเจกต์นี้ `APP_ENV=production` ปิด API สร้างคำสั่งซื้อและยืนยันชำระเงินจำลอง อย่าเปิดขายเงินจริงก่อนเชื่อมและตรวจระบบเหล่านี้

การเปลี่ยน schema ครั้งนี้เป็นการเพิ่มตารางและคอลัมน์ หากต้องย้อนกลับให้หยุดเว็บ/API และกลับไปใช้ commit ก่อนหน้าโดยคงข้อมูลใหม่ไว้ ห้ามลบตาราง order เพื่อ rollback ข้อมูลสำรองใน `.cache/backups` เป็น snapshot ของข้อมูลแอป ไม่ใช่ backup ทั้ง Supabase project

แนวคิดหน้าร้านอ้างอิง [Loaded](https://www.loaded.com/pc) โดยใช้ชื่อและหน้าตา deeKub เอง
