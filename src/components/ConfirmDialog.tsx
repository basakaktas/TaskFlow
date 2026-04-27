"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<(ConfirmDialogProps & { id: string }) | null>(null);

  const show = (props: ConfirmDialogProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    setDialog({ ...props, id });
  };

  const hide = () => setDialog(null);

  return { show, hide, dialog };
}

export function ConfirmDialog({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: (ConfirmDialogProps & { id: string }) | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  if (!dialog) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await dialog.onConfirm();
      onConfirm();
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-start gap-3 p-6">
          {dialog.isDangerous && (
            <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{dialog.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{dialog.description}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dialog.cancelText || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              dialog.isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "..." : dialog.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
