import type { Metadata } from "next";
import { productDetailItem } from "../product-type";
import { CategoryValue, getCategoryLabel, formatPrice } from "../product-utils";

export function homeMetadata(category?: CategoryValue): Metadata {
  const title = category
    ? `${getCategoryLabel(category)} Collection | Fashion Shop`
    : "Shop Collection | Fashion Shop";
  const description = category
    ? `Explore our latest ${getCategoryLabel(category).toLowerCase()} fashion styles and contemporary apparel.`
    : "Browse curated fashion collections for Men, Women, Teens, and Kids.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export function productMetadata(product: productDetailItem): Metadata {
  return {
    title: `${product.name} | Fashion Shop`,
    description:
      product.description ||
      `Buy ${product.name} at Fashion Shop for ${formatPrice(product.price)}.`,
    openGraph: {
      title: `${product.name} | Fashion Shop`,
      description: product.description || `Buy ${product.name} at Fashion Shop.`,
      images: [
        {
          url: product.imageUrl,
          alt: product.name,
        },
      ],
    },
  };
}

export function productJsonLd(
  product: productDetailItem,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.imageUrl,
    description: product.description ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}
