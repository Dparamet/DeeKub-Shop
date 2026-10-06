"use client";

const messages: Record<string, string> = {
  login_required: "กรุณาเข้าสู่ระบบก่อน",
  mock_disabled:
    "ปิดการสั่งซื้อและชำระเงินจำลองใน production กรุณาใช้โหมด development",
  auth_not_configured: "ยังไม่ได้ตั้งค่า Supabase Auth ในไฟล์ .env",
  auth_unavailable: "เชื่อมระบบบัญชีไม่ได้ กรุณาลองใหม่",
  database_unavailable: "เชื่อมฐานข้อมูลไม่ได้ กรุณาลองใหม่",
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  email_not_confirmed: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  invalid_email: "กรอกอีเมลให้ถูกต้อง",
  invalid_password: "รหัสผ่านต้องมี 8 ถึง 128 ตัวอักษร",
  signup_failed:
    "สมัครสมาชิกไม่ได้ กรุณาตรวจอีเมลและรหัสผ่าน หรือลองเข้าสู่ระบบ",
  rate_limited: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
  recovery_link_required: "เปิดลิงก์รีเซ็ตรหัสผ่านจากอีเมลก่อน",
  password_update_failed: "เปลี่ยนรหัสผ่านไม่ได้ ลองใช้รหัสใหม่ที่ต่างจากเดิม",
  confirmation_failed:
    "ลิงก์ยืนยันหมดอายุหรือใช้ไปแล้ว กรุณาลองเข้าสู่ระบบหรือขอลิงก์ใหม่",
  admin_required: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแล",
  price_changed: "ราคาสินค้าเปลี่ยน กรุณาโหลดตะกร้าใหม่แล้วตรวจราคาอีกครั้ง",
  out_of_stock: "สินค้าไม่พอตามจำนวนที่เลือก กรุณาลดจำนวนหรือเลือกใหม่",
  product_unavailable: "สินค้าบางรายการหยุดขายแล้ว กรุณานำออกจากตะกร้า",
  invalid_account_fields: "กรอกข้อมูลบัญชีเกมให้ครบตามช่องที่กำหนด",
  order_expired: "คำสั่งซื้อหมดเวลาชำระแล้ว สต็อกถูกคืน กรุณาสั่งซื้อใหม่",
  invalid_order_state: "คำสั่งซื้อนี้ดำเนินการไปแล้ว กรุณาโหลดใหม่",
  slug_taken: "slug นี้ถูกใช้แล้ว กรุณาเปลี่ยน slug",
  invalid_product: "ตรวจข้อมูลสินค้า ราคา สต็อก และช่องบัญชีเกมให้ถูกต้อง",
  product_changed:
    "สินค้าเปลี่ยนระหว่างแก้ไข กรุณาปิดฟอร์ม โหลดสินค้าใหม่ แล้วแก้ไขอีกครั้ง",
  not_found: "ไม่พบรายการนี้",
  invalid_cart: "ตรวจจำนวนสินค้าในตะกร้า (ไม่เกิน 10 ชิ้นต่อสินค้า)",
  idempotency_conflict: "คำขอสั่งซื้อเดิมมีข้อมูลต่างกัน กรุณาโหลดหน้าใหม่",
};

export function errorMessage(code: string) {
  return messages[code] || "ทำรายการไม่ได้ กรุณาลองใหม่";
}

export async function requestJSON<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new Error("เชื่อมต่อไม่ได้ กรุณาตรวจเครือข่ายแล้วลองใหม่");
  }
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      errorMessage(
        typeof body.error === "string" ? body.error : body.error?.code,
      ),
    );
  return body as T;
}

export type Order = {
  id: string;
  user_id: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  total_minor: number;
  currency: string;
  created_at: string;
  expires_at: string;
  payment_mode: "MOCK";
  items: {
    id: string;
    name: string;
    platform: string;
    region: string;
    quantity: number;
    unit_price_minor: number;
    account_fields: Record<string, string>;
    delivery_note: string;
  }[];
  events: { status: string; created_at: string }[];
};
export const orderStatus = {
  PENDING: "รอชำระเงินจำลอง",
  COMPLETED: "สำเร็จ (จำลอง)",
  CANCELLED: "ยกเลิกแล้ว",
};
export function dateLabel(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
