// Pure display helpers — safe to use on server or client.

/** Price in Bangladeshi Taka, e.g. "৳ 4,60,000" (lakh grouping). */
export const bdt = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "Price N/A"
    : `৳ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;

export const num = (n: number | null | undefined, suffix = "") =>
  n === null || n === undefined ? "—" : `${new Intl.NumberFormat("en-US").format(n)}${suffix}`;

/** Power-to-weight in hp per tonne, a headline comparison metric. Null-safe. */
export const powerToWeight = (hp: number | null | undefined, kg: number | null | undefined) =>
  hp == null || kg == null || kg === 0 ? null : Math.round((hp / kg) * 1000);

/** Build the canonical compare token for a bike. */
export const bikeToken = (manufacturerSlug: string, modelSlug: string) => `${manufacturerSlug}-${modelSlug}`;

/** Flat muted surface for image-less bike/article art. Hue is intentionally
 * ignored — the design uses one calm neutral fill, no rainbow placeholders. */
export const bikeGradient = (_hue?: number) => "#f4f4ed";

export const categoryIcon: Record<string, string> = {
  Sports: "🏁",
  Sport: "🏁",
  Commuter: "🛵",
  Scooter: "🛴",
  Cruiser: "🛣️",
  "Café Racer": "☕",
  Classic: "🏛️",
  Scrambler: "🌄",
  Dirt: "🏔️",
  Touring: "🧭",
  Moped: "🚲",
  Bobber: "🔧",
  Naked: "⚡",
};
