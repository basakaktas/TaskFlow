"use client";

import { useState } from "react";
import { X, Edit2 } from "lucide-react";
import { deleteColumn, updateColumn } from "@/lib/actions/column";
import { showToast } from "./Toast";
import { ConfirmDialog, useConfirmDialog } from "./ConfirmDialog";

export default function ColumnHeader({
  columnId,
  boardId,
  title,
  onUpdateTitle,
}: {
  columnId: string;
  boardId: string;
  title: string;
  onUpdateTitle?: (newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const confirmDialog = useConfirmDialog();

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) {
      showToast("Column title is required", "error");
      setEditTitle(title);
      return;
    }

    setIsSaving(true);
    try {
      await updateColumn(columnId, {
        title: editTitle,
        boardId,
      });
      showToast("Column renamed", "success", 2000);
      onUpdateTitle?.(editTitle);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating column:", error);
      showToast("Failed to rename column", "error");
      setEditTitle(title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    confirmDialog.show({
      title: "Delete Column",
      description:
        "This action cannot be undone. All cards in this column will be deleted.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDangerous: true,
      onConfirm: async () => {
        await deleteColumn(columnId, boardId);
        showToast("Column deleted", "success", 2000);
      },
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={isSaving}
              maxLength={100}
              className="flex-1 rounded-lg bg-slate-700 px-2 py-1 text-sm text-white disabled:opacity-50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setEditTitle(title);
                  setIsEditing(false);
                }
              }}
            />
            <button
              onClick={handleSaveTitle}
              disabled={isSaving}
              className="rounded px-2 py-1 bg-green-600 text-xs disabled:opacity-50"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Rename column"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1 rounded hover:bg-red-900 text-slate-400 hover:text-red-400"
                title="Delete column"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </>
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
