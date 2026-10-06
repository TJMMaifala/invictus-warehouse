"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProduct, setProductFlags } from "@/app/admin/actions";

export function ProductRowActions({ id, published, archived }: { id: string; published: boolean; archived: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); if (!r.ok) alert(r.error); router.refresh(); });
  return (
    <div className={`flex flex-wrap gap-3 text-[13px] ${pending ? "opacity-50" : ""}`}>
      <button className="underline" onClick={() => run(() => setProductFlags(id, { published: !published }))}>{published ? "Unpublish" : "Publish"}</button>
      <button className="underline" onClick={() => run(() => setProductFlags(id, { archived: !archived, ...(archived ? {} : { published: false }) }))}>{archived ? "Restore" : "Archive"}</button>
      <button className="text-bad underline" onClick={() => { if (confirm("Delete this product permanently? Past orders keep their line items.")) run(() => deleteProduct(id)); }}>Delete</button>
    </div>
  );
}
