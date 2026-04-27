"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createColumn(boardId: string, title: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Column title is required");
  }

  if (title.length > 100) {
    title = title.substring(0, 100);
  }

  try {
    // Verify board ownership
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
        userId: session.user.id,
      },
      include: {
        columns: {
          orderBy: { position: "desc" },
          take: 1,
        },
      },
    });

    if (!board) {
      throw new Error("Board not found");
    }

    const lastPosition = board.columns[0]?.position ?? -1;

    await prisma.column.create({
      data: {
        title: title.trim(),
        boardId,
        position: lastPosition + 1,
      },
    });

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error creating column:", error);
    throw error;
  }
}

export async function updateColumn(
  columnId: string,
  data: {
    title: string;
    boardId: string;
  }
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!data.title || data.title.trim().length === 0) {
    throw new Error("Column title is required");
  }

  let title = data.title;
  if (title.length > 100) {
    title = title.substring(0, 100);
  }

  try {
    // Verify column belongs to user's board
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: true,
      },
    });

    if (!column || column.board.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await prisma.column.update({
      where: { id: columnId },
      data: {
        title: title.trim(),
      },
    });

    revalidatePath(`/board/${data.boardId}`);
  } catch (error) {
    console.error("Error updating column:", error);
    throw error;
  }
}

export async function deleteColumn(columnId: string, boardId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify column belongs to user's board
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: true,
      },
    });

    if (!column || column.board.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    // Delete the column (cascades to cards)
    await prisma.column.delete({
      where: { id: columnId },
    });

    // Reorder remaining columns
    const remainingColumns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remainingColumns.map((col, index) =>
        prisma.column.update({
          where: { id: col.id },
          data: { position: index },
        })
      )
    );

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error deleting column:", error);
    throw error;
  }
}

export async function reorderColumns(
  boardId: string,
  columnIds: string[]
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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

    // Update all column positions
    await Promise.all(
      columnIds.map((id, index) =>
        prisma.column.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error reordering columns:", error);
    throw error;
  }
}
