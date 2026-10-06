"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center text-center">
      <div><h1 className="display-lg">Something went wrong</h1><p className="mx-auto mt-3 max-w-md text-mist">We hit a snag loading this page. Check your connection and try again.</p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button></div>
    </div>
  );
}
