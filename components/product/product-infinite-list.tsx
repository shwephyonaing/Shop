"use client";

import { CategoryValue } from "@/src/lib/product-utils";
import { ProductListItem } from "@/src/lib/product-type";
import ProductCardClient from "./product-card-client";

type ProductInfiniteListProps = {
  category?: CategoryValue;
  initialItems: ProductListItem[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
};

function ProductInfinteList({
  category,
  initialItems,
  initialNextCursor,
  initialHasMore,
}: ProductInfiniteListProps) {
  if (initialItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No Products Found</p>
        <p className="text-muted-foreground text-sm">
          Try selecting a different category
        </p>
      </div>
    );
  }
  return (
    <div className="gap-g flex flex-col">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {initialItems.map((product, index) => (
          <ProductCardClient
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
        {/* {isLoadingMore &&
        Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={`skeleton-${index}`}
            className="bg-muted aspect-3/4 w-full animate-pulse rounded-xl"
          />
        ))}
    </div>
    {error && (
      <div className="w-full text-center text-red-500">
        {error.message || "Failed to load more products"}
      </div>
    )}
    {hasMore && !error && (
      <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden />
    )} */}
      </div>
    </div>
  );
}

export default ProductInfinteList;
