"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateCard(
  cardId: string,
  data: {
    title: string;
    description: string;
    dueDate?: string | null;
    boardId: string;
  }
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!data.title || data.title.trim().length === 0) {
    throw new Error("Card title is required");
  }

  if (data.title.length > 500) {
    throw new Error("Card title is too long (max 500 characters)");
  }

  if (data.description.length > 2000) {
    throw new Error("Card description is too long (max 2000 characters)");
  }

  try {
    // Verify the card belongs to a board owned by the user
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

    const updateData: Prisma.CardUpdateInput = {
      title: data.title.trim(),
      description: data.description.trim() || null,
    };

    if (data.dueDate !== undefined) {
      const trimmedDueDate = data.dueDate?.trim();

      if (!trimmedDueDate) {
        updateData.dueDate = null;
      } else {
        const dueDate = new Date(`${trimmedDueDate}T00:00:00`);

        if (Number.isNaN(dueDate.getTime())) {
          throw new Error("Invalid due date");
        }

        updateData.dueDate = dueDate;
      }
    }

    await prisma.card.update({
      where: { id: cardId },
      data: updateData,
    });

    revalidatePath(`/board/${data.boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating card:", error);
    throw new Error("Failed to update card");
  }
}

export async function deleteCard(cardId: string, boardId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify the card belongs to a board owned by the user
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

    const columnId = card.columnId;

    // Delete the card
    await prisma.card.delete({
      where: { id: cardId },
    });

    // Reorder remaining cards in the column
    const remainingCards = await prisma.card.findMany({
      where: { columnId },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remainingCards.map((card, index) =>
        prisma.card.update({
          where: { id: card.id },
          data: { position: index },
        })
      )
    );

    revalidatePath(`/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting card:", error);
    throw new Error("Failed to delete card");
  }
}
