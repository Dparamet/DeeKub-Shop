import { apiRequest } from "@/lib/api-server";
import {
  toStorefrontProduct,
  type ApiCatalogProduct,
} from "@/lib/catalog-adapter";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug))
    return Response.json({ error: { code: "not_found" } }, { status: 404 });
  try {
    const response = await apiRequest(`/products/${slug}`, {}, false);
    if (response.status === 404)
      return Response.json({ error: { code: "not_found" } }, { status: 404 });
    if (!response.ok) throw new Error();
    return Response.json(
      toStorefrontProduct((await response.json()) as ApiCatalogProduct),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: { code: "catalog_unavailable" } },
      { status: 503 },
    );
  }
}
