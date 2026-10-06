import { boundedBody, sameOrigin } from "@/lib/api-server";
import { authConfigured, supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const respond = (code: string, status: number) =>
    Response.json(
      { error: { code } },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  if (!sameOrigin(request)) return respond("invalid_origin", 403);
  if (!authConfigured()) return respond("auth_not_configured", 503);
  let body: { action: string; email?: unknown; password?: unknown };
  try {
    const parsed = JSON.parse(await boundedBody(request));
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !["login", "signup", "logout", "recover", "resend", "reset"].includes(
        parsed.action,
      )
    )
      return respond("invalid_request", 400);
    body = parsed;
  } catch {
    return respond("invalid_request", 400);
  }
  const ok = (data = {}) =>
    Response.json(
      { ok: true, ...data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  function authError(
    error: { code?: string; status?: number },
    fallback: string,
  ) {
    const codes: Record<string, string> = {
      email_not_confirmed: "email_not_confirmed",
      over_email_send_rate_limit: "email_rate_limited",
      over_request_rate_limit: "rate_limited",
      email_address_not_authorized: "email_delivery_unavailable",
      email_provider_disabled: "signup_unavailable",
      signup_disabled: "signup_unavailable",
      weak_password: "weak_password",
      same_password: "password_update_failed",
    };
    if (error.code && codes[error.code])
      return respond(codes[error.code], error.status === 429 ? 429 : 400);
    if (error.status === 429) return respond("rate_limited", 429);
    if (!error.status || error.status >= 500)
      return respond("auth_unavailable", 503);
    return respond(fallback, 400);
  }
  try {
    const supabase = await supabaseServer();
    if (body.action === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error) return respond("auth_unavailable", 503);
      return ok();
    }
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (
      body.action !== "reset" &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    )
      return respond("invalid_email", 400);
    if (
      body.action !== "recover" &&
      body.action !== "resend" &&
      (password.length < (body.action === "login" ? 1 : 8) ||
        password.length > 128)
    )
      return respond("invalid_password", 400);
    const origin = new URL(request.url).origin;
    if (body.action === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return authError(error, "invalid_credentials");
      return ok();
    }
    if (body.action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
      });
      if (error) return authError(error, "signup_failed");
      return ok({ confirmation: !data.session });
    }
    if (body.action === "resend") {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
      });
      if (error) return authError(error, "email_delivery_unavailable");
      return ok();
    }
    if (body.action === "recover") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error) return authError(error, "auth_unavailable");
      return ok();
    }
    if (body.action === "reset") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return respond("recovery_link_required", 401);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return authError(error, "password_update_failed");
      return ok();
    }
    return respond("invalid_request", 400);
  } catch {
    return respond("auth_unavailable", 503);
  }
}
