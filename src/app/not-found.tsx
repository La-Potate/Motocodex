import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-7xl opacity-80" aria-hidden>🏍️</div>
      <p className="mt-4 text-7xl font-black text-graphite-900">404</p>
      <h1 className="mt-3 text-2xl font-black text-graphite-900">That model isn’t in the codex</h1>
      <p className="mt-2 max-w-md text-graphite-600">
        The page you’re after doesn’t exist or may have been moved. Try the finder or browse by manufacturer.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-ghost">Home</Link>
        <Link href="/find-your-bike" className="btn-accent">Find your bike</Link>
      </div>
    </div>
  );
}
