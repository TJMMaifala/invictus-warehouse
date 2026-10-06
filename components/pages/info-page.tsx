import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, intro, children, draft = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; draft?: boolean }) {
  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="display-lg">{title}</h1>
      {intro && <p className="mt-5 text-lg text-mist">{intro}</p>}
      {draft && <p className="mt-6 rounded-lg bg-paper p-4 text-sm">Draft template: items in [BRACKETS] must be completed by the business owner, and this page should be reviewed by a legal professional before launch.</p>}
      <div className="mt-10 space-y-8 leading-relaxed [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:uppercase [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </div>
  );
}
