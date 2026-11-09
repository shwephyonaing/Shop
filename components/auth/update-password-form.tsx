"use client";

import { useEffect, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Check } from "lucide-react";

import AuthFormPanel from "@/components/auth/auth-form-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  updatePasswordSchema,
  UpdatePasswordInput,
} from "@/src/lib/validation/auth";
import { updatePasswordAction } from "@/app/actions/auth";
import { toast } from "@/components/ui/toast";

function UpdatePasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      email,
      otp,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    form.reset({
      email,
      otp,
      password: "",
      confirmPassword: "",
    });
    form.clearErrors();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        form.reset({
          email,
          otp,
          password: "",
          confirmPassword: "",
        });
        form.clearErrors(); 
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [email, otp, form]);

  const onSubmit = (data: UpdatePasswordInput) => {
    form.clearErrors("root");
    startTransition(async () => {
      const result = await updatePasswordAction(data);

      if (!result.success) {
        form.setError("root", {
          message:
            result.error ||
            "Failed to update password. Please verify your OTP code.",
        });
        return;
      }

      form.reset({
        email: "",
        otp: "",
        password: "",
        confirmPassword: "",
      });
      form.clearErrors();

      toast.add({
        title: "Password updated successfully",
        description: "Welcome back! Redirecting to home...",
      });

      // Redirect user directly to home page as requested
      router.push("/");
      router.refresh();
    });
  };

  return (
    <AuthFormPanel
      title="Create New Password"
      description="Your identity has been verified. Please choose a new secure password for your account."
      footer={
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel and return to sign in
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FieldGroup className="gap-5">
          {/* New Password */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter at least 8 characters"
                    className="h-11 rounded-xl pl-10"
                    {...field}
                  />
                  <KeyRound className="size-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <FieldDescription>
                  Must contain uppercase, lowercase, and a number.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    className="h-11 rounded-xl pl-10"
                    {...field}
                  />
                  <Check className="size-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
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
            {isPending ? "Updating password..." : "Update Password & Go Home"}
          </Button>
        </FieldGroup>
      </form>
    </AuthFormPanel>
  );
}

export default function UpdatePasswordForm() {
  return (
    <Suspense>
      <UpdatePasswordFormInner />
    </Suspense>
  );
}

