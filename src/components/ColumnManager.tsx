"use client";

import { useState } from "react";
import { Plus, X, Edit2 } from "lucide-react";
import { createColumn, updateColumn, deleteColumn } from "@/lib/actions/column";
import { showToast } from "./Toast";
import { ConfirmDialog, useConfirmDialog } from "./ConfirmDialog";

export default function ColumnManager({
  boardId,
  columnCount,
}: {
  boardId: string;
  columnCount: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const confirmDialog = useConfirmDialog();

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) {
      showToast("Column title is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      await createColumn(boardId, newColumnTitle);
      showToast("Column created successfully", "success", 2000);
      setNewColumnTitle("");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating column:", error);
      showToast("Failed to create column", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add Column
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Column name"
              disabled={isLoading}
              maxLength={100}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 disabled:opacity-50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateColumn();
                if (e.key === "Escape") setShowForm(false);
              }}
            />
            <button
              onClick={handleCreateColumn}
              disabled={isLoading || !newColumnTitle.trim()}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={isLoading}
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {confirmDialog.dialog && (
        <ConfirmDialog
          dialog={confirmDialog.dialog}
          onConfirm={confirmDialog.hide}
          onCancel={confirmDialog.hide}
        />
      )}
    </>
  );
}
