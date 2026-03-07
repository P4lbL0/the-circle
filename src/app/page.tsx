import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-center px-4">
      <h1 className="text-5xl font-bold text-zinc-50 mb-3 tracking-tight">
        The Circle
      </h1>
      <p className="text-zinc-400 text-lg mb-10">Bientôt disponible</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Se connecter
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
        >
          S&apos;inscrire
        </Link>
      </div>
    </div>
  );
}
