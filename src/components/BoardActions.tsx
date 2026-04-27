"use client";

import { useState } from "react";
import { ConfirmDialog, useConfirmDialog } from "./ConfirmDialog";
import { deleteBoard, renameBoard } from "@/lib/actions/board";
import { showToast } from "./Toast";

export default function BoardActions({
  boardId,
  title,
}: {
  boardId: string;
  title: string;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const confirmDialog = useConfirmDialog();

  const handleRename = async () => {
    if (!newTitle.trim()) {
      showToast("Board title is required", "error");
      setNewTitle(title);
      return;
    }

    setIsRenaming(true);
    try {
      await renameBoard(boardId, newTitle.trim());
      showToast("Board renamed successfully", "success", 2000);
    } catch (error) {
      console.error("Error renaming board:", error);
      showToast("Failed to rename board", "error");
      setNewTitle(title);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = () => {
    confirmDialog.show({
      title: "Delete Board",
      description: "This action cannot be undone. All cards will be deleted.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDangerous: true,
      onConfirm: async () => {
        await deleteBoard(boardId);
      },
    });
  };

  return (
    <>
      <div className="flex gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isRenaming}
          maxLength={100}
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50"
        />

        <button
          onClick={handleRename}
          disabled={isRenaming || newTitle === title}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {isRenaming ? "Saving..." : "Rename"}
        </button>

        <button
          onClick={handleDeleteClick}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
        >
          Delete
        </button>
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
