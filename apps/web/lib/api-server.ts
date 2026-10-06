import { accessToken } from "@/lib/supabase/server";

export type ShopUser = { id: string; email: string; role: "USER" | "ADMIN" };

export async function apiRequest(
  path: string,
  init: RequestInit = {},
  authenticated = true,
) {
  const base = process.env.DEEKUB_API_URL || "http://localhost:8080";
  const headers = new Headers(init.headers);
  if (authenticated) {
    const token = await accessToken();
    if (!token)
      return Response.json(
        { error: { code: "login_required" } },
        { status: 401 },
      );
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}

export async function currentUser(): Promise<{
  user: ShopUser | null;
  unavailable: boolean;
}> {
  try {
    const response = await apiRequest("/me");
    if (response.status === 401) return { user: null, unavailable: false };
    if (!response.ok) return { user: null, unavailable: true };
    return { user: (await response.json()) as ShopUser, unavailable: false };
  } catch {
    return { user: null, unavailable: true };
  }
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_request");
  const decoder = new TextDecoder();
  let text = "";
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 65536) {
      await reader.cancel();
      throw new Error("invalid_request");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}
