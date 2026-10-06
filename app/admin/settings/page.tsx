import { getSettings } from "@/lib/settings";
import { getSizeSets } from "@/lib/data/admin";
import { SettingsForm, SizeSetForm } from "@/components/admin/admin-controls";

export default async function AdminSettings() {
  const [settings, sizes] = await Promise.all([getSettings(), getSizeSets()]);
  return (
    <div className="space-y-10">
      <h1 className="display-lg !text-4xl">Settings</h1>
      <section className="rounded-[var(--radius-card)] bg-paper p-6"><h2 className="mb-4 font-display text-lg font-extrabold uppercase">Business</h2><SettingsForm s={settings} /></section>
      <section className="space-y-6 rounded-[var(--radius-card)] bg-paper p-6">
        <h2 className="font-display text-lg font-extrabold uppercase">Size options</h2>
        <SizeSetForm category="sneakers" label="Sneaker" initial={sizes.sneakers ?? []} />
        <SizeSetForm category="clothing" label="Clothing" initial={sizes.clothing ?? []} />
        <SizeSetForm category="invictus-collection" label="Invictus Collection" initial={sizes["invictus-collection"] ?? []} />
      </section>
    </div>
  );
}
