import Image from "next/image";
import { cn } from "@/lib/utils";

/** An image slot: shows the configured photo, or a typographic plate until one is supplied. */
export function Plate({ src, label, sizes, priority, className }: { src: string | null; label: string; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-stone/70", className)}>
      {src ? (
        <Image src={src} alt={label} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-end p-5" role="img" aria-label={label}>
          <span className="font-display text-[clamp(2.5rem,7vw,6rem)] font-black uppercase leading-[0.85] tracking-tighter text-ink/10">{label}</span>
        </div>
      )}
    </div>
  );
}
