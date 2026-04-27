import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BoardView from "@/components/BoardView";
import BoardActions from "@/components/BoardActions";
import ColumnManager from "@/components/ColumnManager";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        include: {
          cards: {
            orderBy: {
              position: "asc",
            },
            include: {
              labels: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      labels: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!board) {
    return <div className="p-8 text-white">Board not found</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">
          {board.title}
        </h1>

        <div className="flex flex-wrap gap-2">
          <BoardActions boardId={board.id} title={board.title} />
        </div>
      </div>

      <div className="mb-4">
        <ColumnManager boardId={boardId} columnCount={board.columns.length} />
      </div>

      <BoardView
        boardId={board.id}
        columns={board.columns}
        labels={board.labels}
      />
    </main>
  );
}