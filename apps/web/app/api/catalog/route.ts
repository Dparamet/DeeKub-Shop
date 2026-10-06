import {
  toStorefrontProduct,
  type ApiCatalogProduct,
} from "@/lib/catalog-adapter";

const unavailable = () =>
  Response.json(
    { error: "catalog_unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );

export async function GET(request: Request) {
  const apiBaseUrl = process.env.DEEKUB_API_URL?.trim();
  if (!apiBaseUrl) return unavailable();

  const requestUrl = new URL(request.url);
  const requestedType = requestUrl.searchParams.get("type");
  const type = requestedType?.toLowerCase();
  if (type && type !== "topup" && type !== "key") {
    return Response.json({ error: "invalid_product_type" }, { status: 400 });
  }

  const query = requestUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length > 120) {
    return Response.json({ error: "query_too_long" }, { status: 400 });
  }

  try {
    const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
    const upstreamUrl = new URL("products", base);
    if (type)
      upstreamUrl.searchParams.set(
        "type",
        type === "topup" ? "TOPUP" : "GAME_KEY",
      );
    if (query) upstreamUrl.searchParams.set("q", query);

    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!upstream.ok) return unavailable();

    const body = (await upstream.json()) as { items?: ApiCatalogProduct[] };
    if (!Array.isArray(body.items)) return unavailable();

    return Response.json(
      { items: body.items.map(toStorefrontProduct), source: "api" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}
