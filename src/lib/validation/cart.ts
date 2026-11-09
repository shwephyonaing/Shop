import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Please select a size and color"),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(0).max(99),
});

export const removeCartItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
