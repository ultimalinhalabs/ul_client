/**
 * Supabase Auth's messages are English and sometimes technical. Map the ones
 * a person can act on; everything else gets a plain sentence for the step
 * they were on — never a raw provider string. Codes per supabase-js
 * `AuthError.code` (error_codes in the Auth API).
 */
export type AuthStep = "signin" | "signup" | "resend" | "recovery" | "reset";

// Shown under an alert whose title already says what failed — so the body says what to do next, not the same sentence again.
const FALLBACK: Record<AuthStep, string> = {
  signin: "Verifique a ligação e tente novamente dentro de instantes.",
  signup: "Verifique a ligação e tente novamente dentro de instantes.",
  resend: "Tente novamente dentro de instantes.",
  recovery: "Verifique a ligação e tente novamente dentro de instantes.",
  reset: "O link pode ter expirado. Peça um novo link de recuperação e tente novamente.",
};

export function toAuthMessage(error: { message?: string; code?: string }, step: AuthStep): string {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Email ou palavra-passe incorretos.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "O email ainda não foi confirmado. Verifique a sua caixa de correio.";
  }
  if (code.includes("rate_limit") || message.includes("rate limit") || message.includes("security purposes")) {
    return "Demasiadas tentativas. Aguarde um momento e tente novamente.";
  }
  if (code === "weak_password" || message.includes("password should")) {
    return "A palavra-passe é demasiado fraca. Use uma combinação mais longa, com letras e números.";
  }
  if (code === "same_password") return "A nova palavra-passe tem de ser diferente da atual.";
  if (code === "email_address_invalid" || message.includes("invalid format")) return "Introduza um endereço de email válido.";
  if (code === "signup_disabled") return "A criação de contas está temporariamente indisponível.";
  if (code === "session_not_found" || code === "session_expired") {
    return "O link expirou ou já foi usado. Peça um novo para continuar.";
  }
  return FALLBACK[step];
}
