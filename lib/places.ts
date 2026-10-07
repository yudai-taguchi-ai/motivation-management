import { SLOT_COUNT, minuteToSlot, slotToMinute } from "@/lib/day";
import type { DayRecord } from "@/lib/records";
import { rankByCount } from "@/lib/storage";

export const FIXED_PLACES = ["家", "大学", "オフィス", "ジム"] as const;
export type PlaceKind = "home" | "univ" | "office" | "gym" | "other";

const KIND_OF: Record<string, PlaceKind> = {
  家: "home",
  大学: "univ",
  オフィス: "office",
  ジム: "gym",
};

export function placeKind(place: string): PlaceKind {
  return KIND_OF[place] ?? "other";
}

export type PlaceSlots = (string | null)[];
export type PlaceBlock = { place: string; start: number; end: number };

export function emptyPlaces(): PlaceSlots {
  return Array<string | null>(SLOT_COUNT).fill(null);
}

export function paintPlaces(
  slots: PlaceSlots,
  start: number,
  end: number,
  place: string | null,
): PlaceSlots {
  const next = [...slots];
  for (let s = minuteToSlot(start); s < SLOT_COUNT && slotToMinute(s) < end; s++) {
    next[s] = place;
  }
  return next;
}

export function placeBlocks(slots: PlaceSlots): PlaceBlock[] {
  const blocks: PlaceBlock[] = [];
  slots.forEach((place, slot) => {
    const last = blocks[blocks.length - 1];
    if (place === null) return;
    if (last && last.place === place && last.end === slotToMinute(slot)) {
      last.end = slotToMinute(slot + 1);
    } else {
      blocks.push({ place, start: slotToMinute(slot), end: slotToMinute(slot + 1) });
    }
  });
  return blocks;
}

export function knownOtherPlaces(records: DayRecord[]): string[] {
  return rankByCount(
    records.flatMap((r) =>
      r.places.filter((p): p is string => p !== null && placeKind(p) === "other"),
    ),
  );
}
