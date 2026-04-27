import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBoard } from "@/lib/actions/board";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      boards: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Boards</h1>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700">
              Sign out
            </button>
          </form>
        </div>

        {/* Create Board */}
        <form action={createBoard} className="mb-6 flex gap-2">
          <input
            name="title"
            required
            placeholder="New board name"
            className="flex-1 rounded-xl bg-slate-800 p-3"
          />
          <button className="rounded-xl bg-blue-600 px-4 py-2">
            Create
          </button>
        </form>

        {/* Board list */}
        <div className="grid gap-4 sm:grid-cols-2">
          {user?.boards.map((board) => (
            <a
              key={board.id}
              href={`/board/${board.id}`}
              className="rounded-2xl bg-slate-900 p-6 hover:bg-slate-800"
            >
              <h2 className="text-xl font-semibold">{board.title}</h2>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}