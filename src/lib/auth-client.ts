import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
// make sure to import from better-auth/react

export const { signIn, signUp, useSession, emailOtp, signOut } =
  createAuthClient({
    //you can pass client configuration here
    baseURL: process.env.BETTER_AUTH_URL,
    fetchOptions: {
      credentials: "include",
    },
    plugins: [emailOTPClient(), nextCookies()],
  });
