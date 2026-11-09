"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import AuthFormPanel from "@/components/auth/auth-form-panel";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { otpSchema, OtpInput } from "@/src/lib/validation/auth";
import {
  verifyResetPasswordOtp,
  requestPasswordReset,
} from "@/app/actions/auth";
import { toast } from "@/components/ui/toast";

function ForgetPasswordOtpFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isPending, startTransition] = useTransition();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email,
      otp: "",
    },
  });

  useEffect(() => {
    form.reset({ email, otp: "" });
    form.clearErrors();
    setResendStatus(null);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        form.reset({ email, otp: "" });
        form.clearErrors();
        setResendStatus(null);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [email, form]);

  const onSubmit = (data: OtpInput) => {
    form.clearErrors("root");
    startTransition(async () => {
      const result = await verifyResetPasswordOtp(data);

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Invalid OTP code. Please try again.",
        });
        return;
      }

      form.reset({ email: "", otp: "" });
      form.clearErrors();

      const updateUrl = new URL(
        "/forget-password/update-password",
        window.location.origin,
      );
      updateUrl.searchParams.set("email", data.email);
      updateUrl.searchParams.set("otp", data.otp);
      router.push(updateUrl.toString());
    });
  };

  const handleResend = () => {
    if (!email) return;
    setResendStatus(null);
    startTransition(async () => {
      const result = await requestPasswordReset({ email });

      if (!result.success) {
        setResendStatus(result.error || "Failed to resend code.");
        return;
      }

      setResendStatus("A new OTP code has been sent to your email.");
      toast.add({
        title: "Code resent",
        description: `Check your inbox at ${email}`,
      });
    });
  };

  return (
    <AuthFormPanel
      title="Verify Reset Code"
      description={
        email
          ? `Enter the 6-digit verification code sent to ${email}.`
          : "Enter the 6-digit verification code sent to your email."
      }
      footer={
        <Link
          href="/forget-password"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Use a different email address
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FieldGroup className="gap-5">
          <Controller
            name="otp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="items-center">
                <FieldLabel htmlFor="otp">6-Digit Code</FieldLabel>
                <FieldDescription>
                  Enter the code from your Resend email
                </FieldDescription>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    form.clearErrors("root");
                  }}
                  containerClassName="justify-center sm:justify-start gap-2 my-4"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-11" />
                    <InputOTPSlot index={1} className="size-11" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} className="size-11" />
                    <InputOTPSlot index={3} className="size-11" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} className="size-11" />
                    <InputOTPSlot index={5} className="size-11" />
                  </InputOTPGroup>
                </InputOTP>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <FieldError>{form.formState.errors.root.message}</FieldError>
          )}

          {resendStatus && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-green-600">
              {resendStatus}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Verifying..." : "Verify Code"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-xl"
            disabled={isPending}
            onClick={handleResend}
          >
            Resend code
          </Button>
        </FieldGroup>
      </form>
    </AuthFormPanel>
  );
}

export default function ForgetPasswordOtpForm() {
  return (
    <Suspense>
      <ForgetPasswordOtpFormInner />
    </Suspense>
  );
}

