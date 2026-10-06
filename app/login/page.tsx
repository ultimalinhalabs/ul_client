import authPanel from "@/assets/auth/ul-auth-panel-960x1280.png";
import logoPrimary from "@/assets/logo/ul-logo-primary-original.png";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sessão" };

/**
 * ASSET_GUIDE.md §8's recommended pattern: the form on a plain UL Black panel,
 * the pre-composed auth panel filling the other half (cropped with
 * object-cover, never stretched). Below lg the panel is dropped and the
 * primary lockup sits above the form instead.
 */
export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main className="flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Image src={logoPrimary} alt="Última Linha" width={120} height={64} className="h-16 w-auto self-start lg:hidden" priority />
          <div>
            <h1 className="text-title font-semibold text-fg">Iniciar sessão</h1>
            <p className="mt-1.5 text-body text-fg-muted">Aceda à sua organização no ecossistema Última Linha.</p>
          </div>
          <LoginForm />
        </div>
      </main>
      <div className="relative hidden border-l border-border-subtle bg-sidebar lg:block">
        <Image src={authPanel} alt="" fill sizes="50vw" className="object-cover" priority />
      </div>
    </div>
  );
}
