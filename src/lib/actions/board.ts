"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createBoard(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    redirect("/dashboard");
  }

  if (title.length > 100) {
    // Silently truncate instead of erroring
    title.substring(0, 100);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      redirect("/login");
    }

    const board = await prisma.board.create({
      data: {
        title: title.substring(0, 100),
        userId: user.id,
        columns: {
          create: [
            { title: "To Do", position: 0 },
            { title: "In Progress", position: 1 },
            { title: "Done", position: 2 },
          ],
        },
      },
    });

    redirect(`/board/${board.id}`);
  } catch (error) {
    console.error("Error creating board:", error);
    redirect("/dashboard");
  }
}

export async function createCard(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const columnId = String(formData.get("columnId") ?? "").trim();
  const boardId = String(formData.get("boardId") ?? "").trim();

  if (!title || !columnId || !boardId) return;

  if (title.length > 500) {
    // Silently truncate
    title.substring(0, 500);
  }

  try {
    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    await prisma.card.create({
      data: {
        title: title.substring(0, 500),
        columnId,
        position: lastCard ? lastCard.position + 1 : 0,
      },
    });

    revalidatePath(`/board/${boardId}`);
    redirect(`/board/${boardId}`);
  } catch (error) {
    console.error("Error creating card:", error);
    redirect(`/board/${boardId}`);
  }
}

export async function moveCard({
  cardId,
  newColumnId,
  newPosition,
  boardId,
  sourceOrderedIds,
  targetOrderedIds,
}: {
  cardId: string;
  newColumnId: string;
  newPosition: number;
  boardId: string;
  sourceOrderedIds: string[];
  targetOrderedIds: string[];
}) {
  try {
    await prisma.$transaction([
      // update target column
      ...targetOrderedIds.map((id, index) =>
        prisma.card.update({
          where: { id },
          data: {
            position: index,
            ...(id === cardId ? { columnId: newColumnId } : {}),
          },
        })
      ),

      // update source column (reorder after removal)
      ...sourceOrderedIds.map((id, index) =>
        prisma.card.update({
          where: { id },
          data: {
            position: index,
          },
        })
      ),
    ]);

    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error moving card:", error);
    throw new Error("Failed to move card");
  }
}

export async function renameBoard(boardId: string, title: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Board title is required");
  }

  if (title.length > 100) {
    title = title.substring(0, 100);
  }

  try {
    await prisma.board.update({
      where: {
        id: boardId,
        userId: session.user.id,
      },
      data: {
        title: title.trim(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/board/${boardId}`);
  } catch (error) {
    console.error("Error renaming board:", error);
    throw new Error("Failed to rename board");
  }
}

export async function deleteBoard(boardId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.board.delete({
      where: {
        id: boardId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting board:", error);
    throw new Error("Failed to delete board");
  }

  redirect("/dashboard");
}