import { Metadata } from "next";
import { Suspense } from "react";
import UpdatePasswordForm from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Update Password | Fashion Shop",
  description: "Set a new password for your Fashion Shop account.",
};

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
}

