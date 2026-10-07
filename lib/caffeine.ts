import type { DayRecord } from "@/lib/records";
import { rankByCount } from "@/lib/storage";

export type Caffeine = { id: string; at: number; label: string };

export function upsertCaffeine(items: Caffeine[], item: Caffeine): Caffeine[] {
  return [...items.filter((c) => c.id !== item.id), item].sort((a, b) => a.at - b.at);
}

export function knownCaffeineLabels(records: DayRecord[]): string[] {
  return rankByCount(records.flatMap((r) => r.caffeine.map((c) => c.label).filter((l) => l !== "")));
}
