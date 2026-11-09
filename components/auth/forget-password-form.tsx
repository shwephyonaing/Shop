"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import AuthFormPanel from "@/components/auth/auth-form-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/src/lib/validation/auth";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    form.reset({ email: "" });
    form.clearErrors();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        form.reset({ email: "" });
        form.clearErrors();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [form]);

  const handleSendOtp = (values: ForgotPasswordInput) => {
    form.clearErrors("root");
    startTransition(async () => {
      const result = await requestPasswordReset(values);

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Failed to send verification code. Please try again.",
        });
        return;
      }

      form.reset({ email: "" });
      form.clearErrors();

      const verifyUrl = new URL(
        "/forget-password/verify",
        window.location.origin,
      );
      verifyUrl.searchParams.set("email", result.data!.email);
      router.push(verifyUrl.toString());
    });
  };

  return (
    <AuthFormPanel
      title="Forgot Password"
      description="Enter your registered email address and we will send a 6-digit verification OTP code via Resend."
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(handleSendOtp)} autoComplete="off">
        <FieldGroup className="gap-5">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl pl-10"
                    {...field}
                  />
                  <Mail className="size-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <FieldError>{form.formState.errors.root.message}</FieldError>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Sending code..." : "Send Verification Code"}
          </Button>
        </FieldGroup>
      </form>
    </AuthFormPanel>
  );
}
