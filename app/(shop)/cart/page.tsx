import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { getUserCartItems } from "@/src/lib/data/cart";
import CartView from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Shopping Cart | Fashion Shop",
  description: "View and manage items in your shopping cart.",
};

export default async function CartPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const items = await getUserCartItems(session.user.id);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Shopping Cart
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your selected items and proceed to checkout
        </p>
      </div>

      <CartView initialItems={items} />
    </div>
  );
}

