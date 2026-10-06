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
  try {
    const body = JSON.parse(await boundedBody(request)) as {
      action?: string;
      email?: string;
      password?: string;
    };
    const supabase = await supabaseServer();
    if (body.action === "logout") {
      const { error } = await supabase.auth.signOut();
      if (error) return respond("auth_unavailable", 503);
      return Response.json({ ok: true });
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
      if (error)
        return respond(
          error.code === "email_not_confirmed"
            ? "email_not_confirmed"
            : error.status === 429
              ? "rate_limited"
              : "invalid_credentials",
          400,
        );
      return Response.json({ ok: true });
    }
    if (body.action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
      });
      if (error)
        return respond(
          error.status === 429 ? "rate_limited" : "signup_failed",
          400,
        );
      return Response.json({ ok: true, confirmation: !data.session });
    }
    if (body.action === "recover") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error)
        return respond(
          error.status === 429 ? "rate_limited" : "auth_unavailable",
          400,
        );
      return Response.json({ ok: true });
    }
    if (body.action === "reset") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return respond("recovery_link_required", 401);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return respond("password_update_failed", 400);
      return Response.json({ ok: true });
    }
    return respond("invalid_request", 400);
  } catch {
    return respond("auth_unavailable", 503);
  }
}
