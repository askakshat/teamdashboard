"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op fallback so components rendered without provider
    // don't crash. Useful during SSR or unit testing.
    return {
      toast: () => {
        /* no-op */
      },
    };
  }
  return ctx;
}

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: React.ElementType; iconColor: string }
> = {
  success: {
    container: "border-teal-200 bg-white text-slate-900",
    icon: CheckCircle2,
    iconColor: "text-teal-600",
  },
  error: {
    container: "border-red-200 bg-white text-slate-900",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  info: {
    container: "border-slate-200 bg-white text-slate-900",
    icon: Info,
    iconColor: "text-slate-600",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
            {toasts.map((t) => {
              const style = variantStyles[t.variant];
              const Icon = style.icon;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5",
                    "animate-in fade-in slide-in-from-top-2 duration-200",
                    style.container,
                  )}
                  role="status"
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconColor)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
