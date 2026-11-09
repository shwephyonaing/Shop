"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import { signOut } from "@/src/lib/auth-client";

type UserNavProps = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
};

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function UserNavigationClient({ user }: UserNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Sign in"
        className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        <UserIcon className="size-4" />
      </Link>
    );
  }

  const initials = getInitials(user.name);

  return (
    <button
      type="button"
      onClick={handleSignOut}
      title={`Signed in as ${user.name || user.email}. Click to log out.`}
      className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground/80 ring-1 ring-border transition-all hover:bg-muted/80 hover:ring-foreground/20"
      aria-label="User profile and logout"
    >
      {initials}
    </button>
  );
}
