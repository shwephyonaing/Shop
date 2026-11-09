import { CATEGORIES } from "@/src/lib/product-utils";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import UserNavigation from "./user-nav";
import { getSession } from "@/src/lib/session";
import { getUserCartCount } from "@/src/lib/data/cart";

export default async function ShopHeader() {
  const session = await getSession();
  const cartCount = session ? await getUserCartCount(session.user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          Fashion Shop
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {CATEGORIES.map((category) => (
            <Link
              key={category.value}
              href={`/?category=${category.value}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background shadow-xs">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <UserNavigation />
        </div>
      </div>
    </header>
  );
}
