import { buttonClasses } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Não encontrado" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <PageState
        variant="missing"
        eyebrow="404"
        title="Página não encontrada"
        actions={
          <Link href="/app" className={buttonClasses({ variant: "secondary" })}>
            Ir para as suas organizações
          </Link>
        }
      >
        Esta página não existe ou foi movida.
      </PageState>
    </div>
  );
}
