import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-champagne">ÚLTIMA LINHA</p>
        <h1 className="mt-1 text-lg font-medium text-text-primary">Sign in to your organization</h1>
      </div>
      <LoginForm />
    </div>
  );
}
