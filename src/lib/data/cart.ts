import { db } from "@/src/lib/prisma";
import { serialize } from "../serialize";

export type CartItemProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
};

export type CartItemVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  imageUrl: string;
  product: CartItemProduct;
};

export type CartItemWithDetails = {
  userId: string;
  variantId: string;
  quantity: number;
  variant: CartItemVariant;
};

export async function getUserCartItems(
  userId: string,
): Promise<CartItemWithDetails[]> {
  const items = await db.orm.public.CartItem.where({ userId })
    .include("variant", (v) =>
      v
        .select("id", "size", "color", "stock", "imageUrl")
        .include("product", (p) =>
          p.select("id", "name", "slug", "price", "imageUrl", "isActive"),
        ),
    )
    .all();

  return serialize(items) as unknown as CartItemWithDetails[];
}

export async function getUserCartCount(userId: string): Promise<number> {
  const items = await db.orm.public.CartItem.select("quantity")
    .where({ userId })
    .all();

  return items.reduce((total, item) => total + (item.quantity ?? 0), 0);
}

