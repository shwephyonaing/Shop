import { db } from "../prisma";
import { CategoryValue } from "../product-utils";
import { productDetailItem, ProductsPageResult } from "../product-type";
import { serialize } from "../serialize";

export async function queryProductsPage(
  category: CategoryValue | undefined,
  cursor: string | undefined,
  limit: number,
): Promise<ProductsPageResult> {
  let query = db.orm.public.Product.where({ isActive: true });

  if (category) {
    query = query.where({ category });
  }

  let ordered = query.orderBy([(p) => p.createdAt.desc(), (p) => p.id.desc()]);

  if (cursor) {
    const cursorRow = await db.orm.public.Product.select("id", "createdAt")
      .where({ id: cursor })
      .first();

    if (cursorRow) {
      ordered = ordered.cursor({
        createdAt: cursorRow.createdAt,
        id: cursorRow.id,
      });
    }
  }

  const products = await ordered
    .include("productVariants", (v) => v.select("id", "size", "color", "stock"))
    .limit(limit + 1)
    .all();

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;

  return serialize({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore,
  }) as unknown as ProductsPageResult;
}

export async function queryProductDetail(slug: string) {
  const product = await db.orm.public.Product.where({ slug, isActive: true })
    .include("productVariants", (variant) =>
      variant.select("id", "size", "color", "stock", "imageUrl"),
    )
    .first();

  return serialize(product) as unknown as productDetailItem | null;
}
