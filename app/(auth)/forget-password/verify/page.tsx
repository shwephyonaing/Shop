import { Metadata } from "next";
import { Suspense } from "react";
import ForgetPasswordOtpForm from "@/components/auth/forget-password-otp-form";

export const metadata: Metadata = {
  title: "Verify Reset Code | Fashion Shop",
  description: "Verify your email OTP code to reset your password.",
};

export default function ForgetPasswordVerifyPage() {
  return (
    <Suspense>
      <ForgetPasswordOtpForm />
    </Suspense>
  );
}

