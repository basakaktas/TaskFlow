"use client";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createCard, moveCard } from "@/lib/actions/board";
import { showToast } from "./Toast";
import { getLabelColorClass } from "@/lib/labelUtils";
import { CardModal } from "./CardModal";
import ColumnHeader from "./ColumnHeader";
import { formatDateDisplay, isOverdue } from "@/lib/dateUtils";

type Card = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  columnId: string;
  position: number;
  labels?: Array<{ id: string; name: string; color: string }>;
};

type Column = {
  id: string;
  title: string;
  cards: Card[];
};

function SortableCard({
  card,
  disabled = false,
  onEdit,
}: {
  card: Card;
  disabled?: boolean;
  onEdit: (card: Card) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onEdit(card)}
      className={`cursor-grab rounded-xl bg-slate-800 p-3 active:cursor-grabbing transition ${
        isDragging ? "opacity-40" : ""
      } ${disabled ? "opacity-50 pointer-events-none" : ""} hover:bg-slate-700`}
      role="button"
      tabIndex={0}
    >
      <p className="text-sm font-medium">{card.title}</p>
      {card.description && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}
      {card.dueDate && (
        <div
          className={`text-xs mt-2 px-2 py-1 rounded inline-block ${
            isOverdue(card.dueDate)
              ? "bg-red-900 text-red-100"
              : "bg-slate-700 text-slate-200"
          }`}
        >
          {formatDateDisplay(card.dueDate)}
        </div>
      )}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={`${getLabelColorClass(
                label.color
              )} text-white text-xs px-2 py-0.5 rounded`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2">Double-click to edit</p>
    </div>
  );
}

function DroppableColumn({
  column,
  boardId,
  isDisabled = false,
  onEditCard,
}: {
  column: Column;
  boardId: string;
  isDisabled?: boolean;
  onEditCard: (card: Card) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
    disabled: isDisabled,
  });

  const [columnTitle, setColumnTitle] = useState(column.title);

  return (
    <div
      ref={setNodeRef}
      className={`snap-start flex min-h-[70vh] w-[90vw] max-w-[350px] shrink-0 flex-col rounded-2xl p-4 transition sm:w-72 ${
        isOver ? "bg-slate-800" : "bg-slate-900"
      } ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="mb-4">
        <ColumnHeader
          columnId={column.id}
          boardId={boardId}
          title={columnTitle}
          onUpdateTitle={setColumnTitle}
        />
      </div>

      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
        disabled={isDisabled}
      >
        <div className="min-h-[400px] flex-1 space-y-2">
          {column.cards.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
              Drop a task here
            </div>
          )}

          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              disabled={isDisabled}
              onEdit={onEditCard}
            />
          ))}
        </div>
      </SortableContext>

      <form action={createCard} className="mt-4 space-y-2">
        <input type="hidden" name="columnId" value={column.id} />
        <input type="hidden" name="boardId" value={boardId} />

        <input
          name="title"
          required
          placeholder="New card"
          className="w-full rounded-xl bg-slate-800 p-3 text-sm"
          disabled={isDisabled}
        />

        <button
          disabled={isDisabled}
          className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add card
        </button>
      </form>
    </div>
  );
}

export default function BoardView({
  boardId,
  columns,
  labels = [],
}: {
  boardId: string;
  columns: Column[];
  labels?: Array<{ id: string; name: string; color: string }>;
}) {
  const [localColumns, setLocalColumns] = useState(columns);
  const [previousColumns, setPreviousColumns] = useState(columns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  if (columns !== previousColumns) {
    setPreviousColumns(columns);
    setLocalColumns(columns);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveCard(null);

    if (!over) return;

    const activeCardId = String(active.id);
    const activeCardData = active.data.current?.card as Card | undefined;

    if (!activeCardData) return;

    const sourceColumn = localColumns.find((column) =>
      column.cards.some((card) => card.id === activeCardId)
    );

    const targetColumn =
      localColumns.find((column) => column.id === String(over.id)) ??
      localColumns.find((column) =>
        column.cards.some((card) => card.id === String(over.id))
      );

    if (!sourceColumn || !targetColumn) return;

    const isSameColumn = sourceColumn.id === targetColumn.id;

    if (isSameColumn) {
      const oldIndex = sourceColumn.cards.findIndex(
        (card) => card.id === activeCardId
      );

      const newIndex = sourceColumn.cards.findIndex(
        (card) => card.id === String(over.id)
      );

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedCards = [...sourceColumn.cards];
      const [movedCard] = reorderedCards.splice(oldIndex, 1);
      reorderedCards.splice(newIndex, 0, movedCard);

      const updatedColumns = localColumns.map((column) =>
        column.id === sourceColumn.id
          ? {
              ...column,
              cards: reorderedCards.map((card, index) => ({
                ...card,
                position: index,
              })),
            }
          : column
      );

      setLocalColumns(updatedColumns);
      setIsMoving(true);

      moveCard({
        cardId: activeCardId,
        newColumnId: sourceColumn.id,
        newPosition: newIndex,
        boardId,
        sourceOrderedIds: reorderedCards.map((card) => card.id),
        targetOrderedIds: [],
      })
        .then(() => {
          showToast("Card moved successfully", "success", 2000);
        })
        .catch((error) => {
          console.error("Move error:", error);
          setLocalColumns(columns);
          showToast("Failed to move card. Please try again.", "error");
        })
        .finally(() => {
          setIsMoving(false);
        });

      return;
    }

    const targetCardsWithoutMoved = targetColumn.cards.filter(
      (card) => card.id !== activeCardId
    );

    const overCardIndex = targetCardsWithoutMoved.findIndex(
      (card) => card.id === String(over.id)
    );

    const newIndex =
      overCardIndex >= 0 ? overCardIndex : targetCardsWithoutMoved.length;

    const movedCard: Card = {
      ...activeCardData,
      columnId: targetColumn.id,
      position: newIndex,
    };

    let sourceOrderedIds: string[] = [];
    let targetOrderedIds: string[] = [];

    const updatedColumns = localColumns.map((column) => {
      if (column.id === sourceColumn.id) {
        const newSourceCards = column.cards
          .filter((card) => card.id !== activeCardId)
          .map((card, index) => ({
            ...card,
            position: index,
          }));

        sourceOrderedIds = newSourceCards.map((card) => card.id);

        return {
          ...column,
          cards: newSourceCards,
        };
      }

      if (column.id === targetColumn.id) {
        const newTargetCards = [...targetCardsWithoutMoved];
        newTargetCards.splice(newIndex, 0, movedCard);

        const positionedTargetCards = newTargetCards.map((card, index) => ({
          ...card,
          position: index,
        }));

        targetOrderedIds = positionedTargetCards.map((card) => card.id);

        return {
          ...column,
          cards: positionedTargetCards,
        };
      }

      return column;
    });

    setLocalColumns(updatedColumns);
    setIsMoving(true);

    moveCard({
      cardId: activeCardId,
      newColumnId: targetColumn.id,
      newPosition: newIndex,
      boardId,
      sourceOrderedIds,
      targetOrderedIds,
    })
      .then(() => {
        showToast("Card moved to new column", "success", 2000);
      })
      .catch((error) => {
        console.error("Move error:", error);
        setLocalColumns(columns);
        showToast("Failed to move card. Please try again.", "error");
      })
      .finally(() => {
        setIsMoving(false);
      });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          setActiveCard((event.active.data.current?.card as Card) ?? null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory scroll-smooth ${isMoving ? "opacity-75" : ""}`}>
          {isMoving && (
            <div className="fixed inset-0 bg-black/20 pointer-events-none z-40" />
          )}
          {localColumns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              boardId={boardId}
              isDisabled={isMoving}
              onEditCard={setEditingCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rounded-xl bg-slate-700 p-3 shadow-xl">
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard && (
        <CardModal
          card={editingCard}
          boardId={boardId}
          labels={labels}
          onClose={() => setEditingCard(null)}
          onDelete={() => {
            setLocalColumns((prev) =>
              prev.map((col) => ({
                ...col,
                cards: col.cards.filter((c) => c.id !== editingCard.id),
              }))
            );
          }}
        />
      )}
    </>
  );
}
