import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import LoginForm from "@/components/auth/login-form";

async function LoginPageContent() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginPageContent />
    </Suspense>
  );
}
