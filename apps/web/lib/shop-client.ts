"use client";

const messages: Record<string, string> = {
  login_required: "กรุณาเข้าสู่ระบบก่อน",
  mock_disabled:
    "ปิดการสั่งซื้อและชำระเงินจำลองใน production กรุณาใช้โหมด development",
  auth_not_configured: "ยังไม่ได้ตั้งค่า Supabase Auth ในไฟล์ .env",
  auth_unavailable: "เชื่อมระบบบัญชีไม่ได้ กรุณาลองใหม่",
  database_unavailable: "เชื่อมฐานข้อมูลไม่ได้ กรุณาลองใหม่",
  shop_unavailable: "ระบบคำสั่งซื้อยังไม่พร้อม กรุณารอสักครู่แล้วลองใหม่",
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  email_not_confirmed: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  email_rate_limited:
    "ส่งอีเมลถึงขีดจำกัดชั่วคราว กรุณารอแล้วขอลิงก์ใหม่ หากยังไม่ได้รับให้ติดต่อผู้ดูแล",
  email_delivery_unavailable:
    "ระบบยังส่งอีเมลยืนยันให้ไม่ได้ กรุณาติดต่อผู้ดูแลร้าน",
  signup_unavailable: "ยังไม่เปิดรับสมัครสมาชิก กรุณาติดต่อผู้ดูแลร้าน",
  weak_password:
    "รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัย ลองใช้รหัสที่ยาวขึ้นและมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสัญลักษณ์",
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
  invalid_request: "ข้อมูลคำขอไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง",
  invalid_idempotency_key:
    "คำขอสั่งซื้อไม่สมบูรณ์ กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง",
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
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers,
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(30000)])
        : AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error("เชื่อมต่อไม่ได้ กรุณาตรวจเครือข่ายแล้วลองใหม่");
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่");
  }
  if (!response.ok)
    throw new Error(
      errorMessage(
        typeof body?.error === "string" ? body.error : body?.error?.code,
      ),
    );
  return body as T;
}

export type Order = {
  id: string;
  user_id: string;
  buyer_email?: string;
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
