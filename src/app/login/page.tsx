import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold mb-2">TaskFlow</h1>
        <p className="text-slate-400 mb-6">
          Sign in to manage your Kanban boards.
        </p>

        <button
          type="submit"
          className="w-full rounded-xl bg-white px-4 py-3 font-medium text-slate-950 hover:bg-slate-200"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}