"use client";

import { useOptimistic, useTransition, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/src/lib/product-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  updateCartQuantityAction,
  removeCartItemAction,
} from "@/app/actions/cart";
import { CartItemWithDetails } from "@/src/lib/data/cart";
import { toast } from "@/components/ui/toast";

type CartViewProps = {
  initialItems: CartItemWithDetails[];
};

type OptimisticAction =
  | { type: "UPDATE"; variantId: string; quantity: number }
  | { type: "REMOVE"; variantId: string };

export default function CartView({ initialItems }: CartViewProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingVariantId, setLoadingVariantId] = useState<string | null>(null);

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialItems,
    (state: CartItemWithDetails[], action: OptimisticAction) => {
      switch (action.type) {
        case "UPDATE":
          if (action.quantity <= 0) {
            return state.filter((item) => item.variantId !== action.variantId);
          }
          return state.map((item) =>
            item.variantId === action.variantId
              ? { ...item, quantity: action.quantity }
              : item,
          );
        case "REMOVE":
          return state.filter((item) => item.variantId !== action.variantId);
        default:
          return state;
      }
    },
  );

  const subtotal = optimisticItems.reduce((acc, item) => {
    const price = Number(item.variant.product.price) || 0;
    return acc + price * item.quantity;
  }, 0);

  const total = subtotal;

  const handleQuantityChange = (
    variantId: string,
    currentQty: number,
    delta: number,
    stock: number,
  ) => {
    const nextQty = currentQty + delta;
    if (nextQty > stock) {
      toast.add({
        title: "Max stock reached",
        description: `Only ${stock} items available in stock.`,
      });
      return;
    }

    setLoadingVariantId(variantId);
    startTransition(async () => {
      setOptimisticItems({
        type: "UPDATE",
        variantId,
        quantity: nextQty,
      });

      const res = await updateCartQuantityAction({
        variantId,
        quantity: nextQty,
      });

      if (!res.success) {
        toast.add({
          title: "Error",
          description: res.error || "Failed to update quantity.",
        });
      }
      setLoadingVariantId(null);
    });
  };

  const handleRemove = (variantId: string) => {
    setLoadingVariantId(variantId);
    startTransition(async () => {
      setOptimisticItems({
        type: "REMOVE",
        variantId,
      });

      const res = await removeCartItemAction({ variantId });
      if (!res.success) {
        toast.add({
          title: "Error",
          description: res.error || "Failed to remove item.",
        });
      }
      setLoadingVariantId(null);
    });
  };

  if (optimisticItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants(), "mt-6 gap-2")}
        >
          Start Shopping
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      {/* Cart Items List */}
      <div className="flex flex-col gap-4">
        {optimisticItems.map((item) => {
          const { variant, quantity, variantId } = item;
          const { product } = variant;
          const itemImage = variant.imageUrl || product.imageUrl;
          const isItemLoading = loadingVariantId === variantId && isPending;

          return (
            <div
              key={variantId}
              className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border sm:p-5"
            >
              {/* Thumbnail Image */}
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                <Image
                  src={itemImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, 112px"
                />
              </div>

              {/* Product Info & Controls */}
              <div className="flex flex-1 flex-col justify-between self-stretch">
                <div className="space-y-1">
                  <Link
                    href={`/products/${product.slug}`}
                    className="line-clamp-1 font-semibold text-foreground hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Size: <span className="text-foreground/80">{variant.size}</span>{" "}
                    · Color:{" "}
                    <span className="text-foreground/80">{variant.color}</span>
                  </p>
                  <p className="pt-1 text-sm font-bold text-foreground sm:text-base">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Quantity & Delete Controls */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="inline-flex items-center rounded-lg border border-border/80 bg-background shadow-2xs">
                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() =>
                        handleQuantityChange(
                          variantId,
                          quantity,
                          -1,
                          variant.stock,
                        )
                      }
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isItemLoading || quantity >= variant.stock}
                      onClick={() =>
                        handleQuantityChange(
                          variantId,
                          quantity,
                          1,
                          variant.stock,
                        )
                      }
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isItemLoading}
                    onClick={() => handleRemove(variantId)}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Order Summary
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Payment</span>
            <span className="font-medium text-foreground">Cash on Delivery</span>
          </div>

          <div className="border-t border-border/80 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            toast.add({
              title: "Checkout",
              description: "Proceeding to checkout with Cash on Delivery.",
            });
          }}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

