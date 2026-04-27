"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar } from "lucide-react";
import { updateCard, deleteCard } from "@/lib/actions/card";
import { updateCardLabels } from "@/lib/actions/label";
import { getLabelColorClass } from "@/lib/labelUtils";
import { formatDate, formatDateDisplay, isOverdue } from "@/lib/dateUtils";
import { showToast } from "./Toast";

export type Card = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  columnId: string;
  labels?: Array<{ id: string; name: string; color: string }>;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export function CardModal({
  card,
  boardId,
  labels = [],
  onClose,
  onDelete,
}: {
  card: Card;
  boardId: string;
  labels?: Label[];
  onClose: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(formatDate(card.dueDate));
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    card.labels?.map((l) => l.id) || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Card title is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateCard(card.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        boardId,
      });

      // Update labels
      if (selectedLabels.length > 0 || card.labels?.length) {
        await updateCardLabels(card.id, selectedLabels, boardId);
      }

      showToast("Card updated successfully", "success", 2000);
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error saving card:", error);
      showToast("Failed to save card", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCard(card.id, boardId);
      showToast("Card deleted successfully", "success", 2000);
      onDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting card:", error);
      showToast("Failed to delete card", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const isCardOverdue = isOverdue(dueDate);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Edit Card</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            disabled={isSaving || isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving || isDeleting}
              maxLength={500}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white disabled:opacity-50"
              placeholder="Card title"
            />
            <p className="text-xs text-slate-500 mt-1">
              {title.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving || isDeleting}
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white disabled:opacity-50 resize-none"
              placeholder="Add a description..."
            />
            <p className="text-xs text-slate-500 mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Due Date
            </label>
            <div className="flex gap-2 items-center">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSaving || isDeleting}
                className={`flex-1 rounded-lg bg-slate-800 border px-3 py-2 text-white disabled:opacity-50 ${
                  isCardOverdue ? "border-red-500" : "border-slate-700"
                }`}
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate("")}
                  disabled={isSaving || isDeleting}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            {dueDate && (
              <p
                className={`text-xs mt-1 ${
                  isCardOverdue ? "text-red-400" : "text-slate-400"
                }`}
              >
                {formatDateDisplay(dueDate)}
                {isCardOverdue && " (Overdue!)"}
              </p>
            )}
          </div>

          {labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    disabled={isSaving || isDeleting}
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      getLabelColorClass(label.color)
                    } ${
                      selectedLabels.includes(label.id)
                        ? "ring-2 ring-white"
                        : "opacity-60 hover:opacity-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed transition`}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700 justify-between">
          <button
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            className="px-4 py-2 rounded-lg bg-red-900 text-red-200 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
