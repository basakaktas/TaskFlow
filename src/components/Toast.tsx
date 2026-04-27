"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

declare global {
  interface Window {
    showToast?: (message: string, type?: ToastType, duration?: number) => void;
  }
}

const typeConfig = {
  success: {
    bg: "bg-green-900",
    border: "border-green-600",
    icon: CheckCircle,
    text: "text-green-200",
  },
  error: {
    bg: "bg-red-900",
    border: "border-red-600",
    icon: AlertCircle,
    text: "text-red-200",
  },
  info: {
    bg: "bg-blue-900",
    border: "border-blue-600",
    icon: Info,
    text: "text-blue-200",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = typeConfig[toast.type];
  const IconComponent = config.icon;

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`${config.bg} ${config.border} ${config.text} flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg`}
      role="alert"
    >
      <IconComponent className="h-5 w-5 shrink-0" />
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-opacity-50 hover:text-opacity-100"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Store context on window for easy access
  useEffect(() => {
    window.showToast = (
      message: string,
      type: ToastType = "info",
      duration = 4000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, message, duration };
      setToasts((prev) => [...prev, newToast]);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

// Helper function for easy usage
export function showToast(
  message: string,
  type: ToastType = "info",
  duration = 4000
) {
  if (typeof window !== "undefined" && window.showToast) {
    window.showToast(message, type, duration);
  }
}
