"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { requestJSON, errorMessage } from "@/lib/shop-client";

export function AuthForm({
  configured,
  initial = "login",
}: {
  configured: boolean;
  initial?: "login" | "signup" | "reset";
}) {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "recover" | "reset">(
    initial,
  );
  const [error, setError] = useState(
    params.get("error") ? errorMessage(params.get("error")!) : "",
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const titles = {
    login: "เข้าสู่ระบบ",
    signup: "สร้างบัญชี deeKub",
    recover: "ลืมรหัสผ่าน",
    reset: "ตั้งรหัสผ่านใหม่",
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (
      (mode === "signup" || mode === "reset") &&
      password !== data.get("confirm")
    ) {
      setError("รหัสผ่านสองช่องไม่ตรงกัน");
      return;
    }
    setBusy(true);
    try {
      const result = await requestJSON<{ confirmation?: boolean }>(
        "/api/auth",
        {
          method: "POST",
          body: JSON.stringify({
            action: mode,
            email: data.get("email"),
            password,
          }),
        },
      );
      if (mode === "recover")
        setNotice(
          "ถ้ามีบัญชีนี้ในระบบ เราจะส่งลิงก์รีเซ็ตไปให้ ตรวจ Inbox และ Spam แล้วเปิดลิงก์ในเบราว์เซอร์นี้",
        );
      else if (mode === "signup" && result.confirmation)
        setNotice(
          "ส่งอีเมลยืนยันแล้ว เปิดลิงก์ในอีเมลด้วยเบราว์เซอร์นี้ก่อนเข้าสู่ระบบ",
        );
      else {
        const destination = params.get("next");
        window.location.assign(
          destination && ["/cart", "/account", "/admin"].includes(destination)
            ? destination
            : "/account",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function change(next: typeof mode) {
    setMode(next);
    setNotice("");
    setError("");
  }
  return (
    <>
      <ShopHeader />
      <main className="auth-container" id="main-content">
        <Link className="back-link" href="/">
          กลับหน้าร้าน
        </Link>
        <div className="shop-panel">
          <p className="eyebrow">deeKub account</p>
          <h1>{titles[mode]}</h1>
          <p className="muted">
            {mode === "login"
              ? "เข้าใช้งานตะกร้าและประวัติคำสั่งซื้อ"
              : mode === "signup"
                ? "บัญชีเดียวสำหรับ Game Keys และเติมเกม"
                : "ใช้รหัสผ่านสำหรับบัญชี deeKub ของคุณ"}
          </p>
          {!configured ? (
            <p className="form-error" role="alert">
              ยังไม่ได้ตั้งค่า Supabase Auth ใน .env ที่โฟลเดอร์หลัก
            </p>
          ) : (
            <form className="shop-form" onSubmit={submit} key={mode}>
              {mode !== "reset" && (
                <label>
                  อีเมล
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                  />
                </label>
              )}
              {mode !== "recover" && (
                <>
                  <label>
                    รหัสผ่าน
                    <input
                      name="password"
                      type={visible ? "text" : "password"}
                      required
                      minLength={mode === "login" ? 1 : 8}
                      maxLength={128}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                  </label>
                  <button
                    className="text-button"
                    type="button"
                    aria-pressed={visible}
                    onClick={() => setVisible((v) => !v)}
                  >
                    {visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  </button>
                </>
              )}
              {(mode === "signup" || mode === "reset") && (
                <label>
                  ยืนยันรหัสผ่าน
                  <input
                    name="confirm"
                    type={visible ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="form-success" role="status">
                  {notice}
                </p>
              )}
              <button className="button" disabled={busy}>
                {busy
                  ? "กำลังดำเนินการ…"
                  : mode === "recover"
                    ? "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                    : titles[mode]}
              </button>
            </form>
          )}
          {mode === "login" ? (
            <div className="auth-links">
              <button className="text-button" onClick={() => change("signup")}>
                ยังไม่มีบัญชี? สมัครสมาชิก
              </button>
              <button className="text-button" onClick={() => change("recover")}>
                ลืมรหัสผ่าน
              </button>
            </div>
          ) : (
            <button className="text-button" onClick={() => change("login")}>
              กลับไปเข้าสู่ระบบ
            </button>
          )}
        </div>
      </main>
    </>
  );
}
