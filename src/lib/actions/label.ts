"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const COLOR_OPTIONS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "gray",
];

export async function createLabel(
  boardId: string,
  name: string,
  color: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Label name is required");
  }

  if (!COLOR_OPTIONS.includes(color)) {
    throw new Error("Invalid color");
  }

  const trimmedName = name.trim().substring(0, 50);

  try {
    // Verify board ownership
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
        userId: session.user.id,
      },
    });

    if (!board) {
      throw new Error("Board not found");
    }

    // Check if label already exists
    const existing = await prisma.label.findUnique({
      where: {
        boardId_name: {
          boardId,
          name: trimmedName,
        },
      },
    });

    if (existing) {
      throw new Error("Label already exists");
    }

    await prisma.label.create({
      data: {
        name: trimmedName,
        color,
        boardId,
      },
    });

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error creating label:", error);
    throw error;
  }
}

export async function updateCardLabels(
  cardId: string,
  labelIds: string[],
  boardId: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify card ownership
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!card || card.column.board.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    // Update card labels
    await prisma.card.update({
      where: { id: cardId },
      data: {
        labels: {
          set: labelIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error updating card labels:", error);
    throw error;
  }
}

export async function deleteLabel(labelId: string, boardId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify label ownership
    const label = await prisma.label.findUnique({
      where: { id: labelId },
      include: {
        board: true,
      },
    });

    if (!label || label.board.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await prisma.label.delete({
      where: { id: labelId },
    });

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error deleting label:", error);
    throw error;
  }
}
