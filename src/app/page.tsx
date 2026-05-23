import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page flex flex-col items-center justify-center p-6">
      <h1 className="mb-10 text-2xl font-semibold">Trivia Buzzer</h1>
      <nav className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/join" className="btn btn-primary">
          Join
        </Link>
        <Link href="/host" className="btn">
          Host
        </Link>
        <Link href="/display" className="btn">
          Display
        </Link>
      </nav>
    </main>
  );
}
