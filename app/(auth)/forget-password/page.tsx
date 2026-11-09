import { Metadata } from "next";
import { Suspense } from "react";
import ForgetPasswordForm from "@/components/auth/forget-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Fashion Shop",
  description: "Reset your password using an email verification code.",
};

export default function ForgetPasswordPage() {
  return (
    <Suspense>
      <ForgetPasswordForm />
    </Suspense>
  );
}

