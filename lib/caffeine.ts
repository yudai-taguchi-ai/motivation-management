import { keysWithPrefix, rankByCount, readJSON, writeJSON } from "@/lib/storage";

export type Caffeine = { id: string; at: number; label: string };

const PREFIX = "caffeine:";

export function loadCaffeine(date: string): Caffeine[] {
  return readJSON<Caffeine[]>(PREFIX + date, []);
}

export function saveCaffeine(date: string, items: Caffeine[]): void {
  writeJSON(PREFIX + date, items, items.length === 0);
}

export function upsertCaffeine(items: Caffeine[], item: Caffeine): Caffeine[] {
  return [...items.filter((c) => c.id !== item.id), item].sort((a, b) => a.at - b.at);
}

export function knownCaffeineLabels(): string[] {
  const all = keysWithPrefix(PREFIX).flatMap((key) =>
    readJSON<Caffeine[]>(key, [])
      .map((c) => c.label)
      .filter((l) => l !== ""),
  );
  return rankByCount(all);
}
