"use server";

import z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/session";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/src/lib/validation/cart";

export async function addToCartAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { variantId, quantity } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      // Check if the product variant exists and has enough stock
      const variant = await tx.orm.public.ProductVariant.where({
        id: variantId,
      })
        .include("product", (p) => p.select("isActive"))
        .first();

      if (!variant || !variant.product?.isActive) {
        return { success: false, error: "Product variant not found" };
      }

      const existingCartItem = await tx.orm.public.CartItem.where({
        userId: session.user.id,
        variantId,
      }).first();

      const totalQuantity = existingCartItem
        ? existingCartItem.quantity + quantity
        : quantity;

      if (Number(variant.stock) < totalQuantity) {
        return { success: false, error: "Not enough stock available" };
      }

      if (existingCartItem) {
        await tx.orm.public.CartItem.where({
          userId: session.user.id,
          variantId,
        }).update({ quantity: totalQuantity });
      } else {
        await tx.orm.public.CartItem.create({
          userId: session.user.id,
          variantId,
          quantity,
        });
      }
    });

    revalidatePath("/cart", "layout");
    return { success: true };
  } catch {
    // console.error("Error adding to cart:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

export async function updateCartQuantityAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = updateCartItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { variantId, quantity } = parsed.data;

  try {
    if (quantity <= 0) {
      await db.orm.public.CartItem.where({
        userId: session.user.id,
        variantId,
      }).delete();
      revalidatePath("/cart", "layout");
      return { success: true };
    }

    const variant = await db.orm.public.ProductVariant.where({
      id: variantId,
    }).first();

    if (!variant) {
      return { success: false, error: "Product variant not found" };
    }

    if (Number(variant.stock) < quantity) {
      return { success: false, error: "Not enough stock available" };
    }

    await db.orm.public.CartItem.where({
      userId: session.user.id,
      variantId,
    }).update({ quantity });

    revalidatePath("/cart", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update cart" };
  }
}

export async function removeCartItemAction(input: unknown) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = removeCartItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { variantId } = parsed.data;

  try {
    await db.orm.public.CartItem.where({
      userId: session.user.id,
      variantId,
    }).delete();

    revalidatePath("/cart", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove item from cart" };
  }
}
