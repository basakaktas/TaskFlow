import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BoardView from "@/components/BoardView";
import { deleteBoard, renameBoard } from "@/lib/actions/board";
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
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{board.title}</h1>
        <BoardActions boardId={board.id} title={board.title} />
      </div>

      <div className="mb-6">
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