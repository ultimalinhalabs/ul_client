import { getErrorDetail, toHumanMessage } from "@/lib/api/errors";
import { create } from "zustand";

export interface Toast {
  id: string;
  tone: "success" | "error";
  message: string;
  /** Secondary line — for an error, the backend's own message (lib/api/errors.ts's getErrorDetail). */
  detail?: string | null;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  /** The one error-toast path for a failed mutation — same translation and detail as ErrorAlert. */
  pushError: (error: unknown) => void;
  dismiss: (id: string) => void;
}

// Errors stay a little longer — they usually need reading, a success rarely does.
const DURATION_MS = { success: 5000, error: 8000 } as const;

/**
 * Global by necessity, not convenience — a mutation's success/error toast
 * is triggered from a dialog or form that unmounts immediately after (e.g.
 * a Dialog closing on submit), so the notification must outlive the
 * component that raised it. This is exactly the "state realmente global"
 * Zustand is for; everything else (organizations, members, applications,
 * ...) stays in TanStack Query, never here — this store holds no server data.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), DURATION_MS[toast.tone]);
  },
  pushError: (error) => get().push({ tone: "error", message: toHumanMessage(error), detail: getErrorDetail(error) }),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
