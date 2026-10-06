import { apiRequest, boundedBody, sameOrigin } from "@/lib/api-server";

const uuid = "[0-9a-fA-F-]{36}";
const allowed: Record<string, RegExp> = {
  GET: new RegExp(`^(me|orders|orders/${uuid}|admin/products|admin/orders)$`),
  POST: new RegExp(
    `^(orders|orders/${uuid}/(cancel|mock-payment)|admin/products)$`,
  ),
  PUT: new RegExp(`^admin/products/${uuid}$`),
};

async function relay(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  if (!allowed[request.method]?.test(route))
    return Response.json({ error: { code: "not_found" } }, { status: 404 });
  if (request.method !== "GET" && !sameOrigin(request))
    return Response.json(
      { error: { code: "invalid_origin" } },
      { status: 403 },
    );
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const key = request.headers.get("Idempotency-Key");
    if (key) headers["Idempotency-Key"] = key;
    const response = await apiRequest(`/${route}`, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await boundedBody(request),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "shop_unavailable" } },
      { status: 503 },
    );
  }
}
export const GET = relay;
export const POST = relay;
export const PUT = relay;
