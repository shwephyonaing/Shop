"use server";

import z from "zod";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import {
  RegisterInput,
  LoginInput,
  registerSchema,
  otpSchema,
  OtpInput,
  emailSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
  updatePasswordSchema,
  ForgotPasswordInput,
  ResetPasswordWithOtpInput,
  UpdatePasswordInput,
} from "@/src/lib/validation/auth";
import { db } from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { ErrorCodes } from "@/src/lib/error-code";
import { isAdminRole } from "@/src/lib/auth/role";
import {
  applyPendingRegistration,
  upsertPendingRegistration,
} from "@/src/lib/auth/pending-registration";

export async function registerUser(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await db.orm.public.User.select(
    "id",
    "emailVerified",
    "role",
    "isFrozen",
  )
    .where({ email: normalizedEmail })
    .first();

  if (existingUser && existingUser?.isFrozen) {
    return {
      success: false,
      error: ErrorCodes.ACCOUNT_FROZEN.message,
      code: ErrorCodes.ACCOUNT_FROZEN.code,
    };
  }

  if (existingUser && isAdminRole(existingUser.role)) {
    return {
      success: false,
      error: ErrorCodes.ADMIN_ACCOUNT.message,
      code: ErrorCodes.ADMIN_ACCOUNT.code,
    };
  }

  if (existingUser && existingUser?.emailVerified) {
    return {
      success: false,
      error: ErrorCodes.EMAIL_ALREADY_EXISTS.message,
      code: ErrorCodes.EMAIL_ALREADY_EXISTS.code,
    };
  }

  if (existingUser && !existingUser?.emailVerified) {
    try {
      await upsertPendingRegistration(normalizedEmail, name, password);
      await auth.api.sendVerificationOTP({
        body: {
          email: normalizedEmail,
          type: "email-verification",
        },
        headers: await headers(),
      });
    } catch {
      return {
        success: false,
        error: "Failed to create pending registration. Please try again later.",
      };
    }
    return {
      success: true,
      data: { email: normalizedEmail, resumed: true },
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email: normalizedEmail,
        password,
      },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to create account. Please try again later.";
    return { success: false, error: message };
  }

  try {
    await auth.api.sendVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "email-verification",
      },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to send verification email. Please try again later.";
    return { success: false, error: message };
  }

  return { success: true, data: { email: normalizedEmail } };
}

export async function completeRegistrationVerification(input: OtpInput) {
  const parsed = otpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, otp } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await auth.api.verifyEmailOTP({
      body: {
        email: normalizedEmail,
        otp,
      },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to verify OTP. Please try again later.";

    if (message.toLocaleLowerCase().includes("invalid otp")) {
      return {
        success: false,
        error: "Invalid OTP. Please check the code and try again.",
      };
    }

    if (message.toLocaleLowerCase().includes("expired")) {
      return {
        success: false,
        error: "OTP has expired. Please request a new code.",
      };
    }

    if (message.toLocaleLowerCase().includes("too many attempts")) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code.",
      };
    }

    return { success: false, error: message };
  }

  await applyPendingRegistration(normalizedEmail);

  return { success: true };
}

export async function resendRegistrationVerification(input: { email: string }) {
  const parsed = emailSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const normalizedEmail = input.email.toLowerCase();

  const existingUser = await db.orm.public.User.select(
    "emailVerified",
    "role",
    "isFrozen",
  )
    .where({ email: normalizedEmail })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "No account found with this email. Please register first.",
    };
  }

  if (existingUser?.isFrozen) {
    return {
      success: false,
      error: ErrorCodes.ACCOUNT_FROZEN.message,
      code: ErrorCodes.ACCOUNT_FROZEN.code,
    };
  }

  if (isAdminRole(existingUser.role)) {
    return {
      success: false,
      error: ErrorCodes.ADMIN_ACCOUNT.message,
      code: ErrorCodes.ADMIN_ACCOUNT.code,
    };
  }

  if (existingUser?.emailVerified) {
    return {
      success: false,
      error: "This account is already verified. Please log in.",
    };
  }

  try {
    await auth.api.sendVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "email-verification",
      },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to resend verification email. Please try again later.";
    return { success: false, error: message };
  }

  return {
    success: true,
    data: { email: normalizedEmail },
    message: "Verification email resent successfully.",
  };
}

export async function validateLoginCredentials(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  const normalizedEmail = email.toLowerCase();

  const existingUser = await db.orm.public.User.select("role", "isFrozen")
    .where({ email: normalizedEmail })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "No account found with this email. Please register first.",
    };
  }

  if (existingUser?.isFrozen) {
    return {
      success: false,
      error: ErrorCodes.ACCOUNT_FROZEN.message,
      code: ErrorCodes.ACCOUNT_FROZEN.code,
    };
  }

  if (isAdminRole(existingUser.role)) {
    return {
      success: false,
      error: ErrorCodes.ADMIN_ACCOUNT.message,
      code: ErrorCodes.ADMIN_ACCOUNT.code,
    };
  }

  try {
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: normalizedEmail,
        password,
      },
      headers: await headers(),
    });

    if (!signInResponse) {
      return {
        success: false,
        error:
          "Invalid email or password. Please check your credentials and try again.",
      };
    }

    await auth.api.signOut({
      headers: await headers(),
    });

    await auth.api.sendVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "sign-in",
      },
      headers: await headers(),
    });

    return {
      success: true,
      data: { email: normalizedEmail },
      message:
        "Login credentials validated successfully. Please check your email for the verification code.",
    };
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to validate login credentials. Please try again later.";
    return { success: false, error: message };
  }
}

export async function requestPasswordReset(data: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const user = await db.orm.public.User.select("id", "isFrozen")
    .where({ email: normalizedEmail })
    .first();

  if (!user) {
    return {
      success: false,
      error: "No account found with this email address.",
    };
  }

  if (user.isFrozen) {
    return {
      success: false,
      error: ErrorCodes.ACCOUNT_FROZEN.message,
      code: ErrorCodes.ACCOUNT_FROZEN.code,
    };
  }

  try {
    await auth.api.sendVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "forget-password",
      },
      headers: await headers(),
    });

    return {
      success: true,
      data: { email: normalizedEmail },
      message: "A verification code has been sent to your email.",
    };
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to send verification code. Please try again later.";
    return { success: false, error: message };
  }
}

export async function verifyResetPasswordOtp(data: OtpInput) {
  const parsed = otpSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, otp } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await auth.api.checkVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "forget-password",
        otp,
      },
      headers: await headers(),
    });

    return {
      success: true,
      data: { email: normalizedEmail, otp },
    };
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to verify OTP. Please try again.";

    if (message.toLowerCase().includes("invalid")) {
      return {
        success: false,
        error: "Invalid verification code. Please check and try again.",
      };
    }

    if (message.toLowerCase().includes("expired")) {
      return {
        success: false,
        error: "Verification code has expired. Please request a new code.",
      };
    }

    return { success: false, error: message };
  }
}

export async function updatePasswordAction(data: UpdatePasswordInput) {
  const parsed = updatePasswordSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, otp, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await auth.api.resetPasswordEmailOTP({
      body: {
        email: normalizedEmail,
        otp,
        password,
      },
      headers: await headers(),
    });

    // Auto sign in user after updating password
    try {
      await auth.api.signInEmail({
        body: {
          email: normalizedEmail,
          password,
        },
        headers: await headers(),
      });
    } catch {
      // If auto-signin encounters any warning, proceed
    }

    return {
      success: true,
      message: "Password updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to update password. Please check your verification code.";
    return { success: false, error: message };
  }
}

export async function resetPasswordWithOtp(data: ResetPasswordWithOtpInput) {
  const parsed = resetPasswordWithOtpSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email, otp, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await auth.api.resetPasswordEmailOTP({
      body: {
        email: normalizedEmail,
        otp,
        password,
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
    };
  } catch (error) {
    const message =
      error instanceof APIError
        ? error.message
        : "Failed to reset password. Please check your OTP and try again.";
    return { success: false, error: message };
  }
}
