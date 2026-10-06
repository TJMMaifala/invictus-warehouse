import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

export function WhatsAppFab({ number }: { number: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number, "Hi Invictus Warehouse, I have a question.")} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-paper shadow-soft transition-transform hover:scale-105">
      <MessageCircle className="size-4" /> <span className="hidden sm:inline">Chat on WhatsApp</span><span className="sm:hidden">Chat</span>
    </a>
  );
}
