import { create } from "zustand";

export interface Toast {
  id: string;
  tone: "success" | "error";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

/**
 * Global by necessity, not convenience — a mutation's success/error toast
 * is triggered from a dialog or form that unmounts immediately after, so
 * the notification must outlive the component that raised it. Everything
 * else (organizations, members, applications, ...) stays in TanStack
 * Query, never here — this store holds no server data.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
