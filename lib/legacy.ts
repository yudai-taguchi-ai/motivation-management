import { normalizeRecord, type DayRecord } from "@/lib/records";
import { keysWithPrefix, readJSON } from "@/lib/storage";

// ③より前はブラウザの中（localStorage）に保存していた
const PREFIXES = ["mood:", "places:", "notes:", "caffeine:"] as const;

function legacyKeys(): string[] {
  return PREFIXES.flatMap((p) => keysWithPrefix(p));
}

export function readLegacyRecords(): DayRecord[] {
  const dates = new Set(legacyKeys().map((k) => k.slice(k.indexOf(":") + 1)));
  return [...dates].sort().map((date) =>
    normalizeRecord({
      date,
      mood: readJSON<{ points?: DayRecord["mood"] }>(`mood:${date}`, {}).points,
      places: readJSON<DayRecord["places"] | undefined>(`places:${date}`, undefined),
      notes: readJSON<DayRecord["notes"]>(`notes:${date}`, []),
      caffeine: readJSON<DayRecord["caffeine"]>(`caffeine:${date}`, []),
    }),
  );
}

export function clearLegacy(): void {
  try {
    for (const key of legacyKeys()) localStorage.removeItem(key);
  } catch {}
}
