"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl" aria-hidden>
        🛠️
      </span>
      <h1 className="mt-6 text-3xl font-black text-graphite-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-graphite-600">
        That page could not be loaded. It is usually temporary — try again, or head back to the
        directory.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-accent">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
