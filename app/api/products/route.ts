import { NextRequest, NextResponse } from "next/server";
import { getProductPage } from "@/src/lib/data/product";
import { CategoryValue, CATEGORIES } from "@/src/lib/product-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) : 12;

  const rawCategory = searchParams.get("category");
  const validCategoryValues = CATEGORIES.map((c) => c.value);
  const category = validCategoryValues.includes(rawCategory as CategoryValue)
    ? (rawCategory as CategoryValue)
    : undefined;

  try {
    const pageResult = await getProductPage(category, cursor, limit);

    return NextResponse.json({
      success: true,
      data: pageResult,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load products",
      },
      { status: 500 },
    );
  }
}

