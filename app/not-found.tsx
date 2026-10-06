import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center text-center">
      <div><p className="eyebrow">404</p><h1 className="display-xl !text-[clamp(2.5rem,7vw,6rem)] mt-3">Looks like this drop doesn’t exist.</h1>
        <p className="mx-auto mt-4 max-w-md text-mist">The page may have sold out, moved, or never existed.</p>
        <Link href="/shop" className="btn-primary mt-8">Return to shop</Link></div>
    </div>
  );
}
