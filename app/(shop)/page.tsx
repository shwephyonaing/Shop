import { Suspense } from "react";
import type { Metadata } from "next";

import CategoryFilter from "@/components/product/catefory-filter";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { CategoryValue } from "@/src/lib/product-utils";
import ProductGrid from "@/components/product/product-grid";
import { homeMetadata } from "@/src/lib/seo";

const VALID_CATEGORIES = ["MEN", "WOMEN", "TEENS", "CHILD", "KIDS"] as const;

type ProductGridSectionProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

function parseCategory(
  category: string | undefined,
): CategoryValue | undefined {
  return VALID_CATEGORIES.includes(category as CategoryValue)
    ? (category as CategoryValue)
    : undefined;
}

type HomePageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { category } = await searchParams;
  return homeMetadata(parseCategory(category));
}

async function ProductGridSection({ searchParams }: ProductGridSectionProps) {
  const { category } = await searchParams;
  const validCategories = ["MEN", "WOMEN", "TEENS", "CHILD", "KIDS"] as const;
  const selecetedCategory = validCategories.includes(category as CategoryValue)
    ? (category as CategoryValue)
    : undefined;

  return <ProductGrid category={selecetedCategory} />;
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Shop Collection</h1>
        <p className="text-muted-foreground">
          Browse our latest fashion for Men, Women, Teens, Child, and Kids
        </p>
      </div>
      <CategoryFilter />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGridSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
