import { SLOT_COUNT, minuteToSlot, slotToMinute } from "@/lib/day";
import { keysWithPrefix, rankByCount, readJSON, writeJSON } from "@/lib/storage";

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

const PREFIX = "places:";

export function emptyPlaces(): PlaceSlots {
  return Array<string | null>(SLOT_COUNT).fill(null);
}

export function loadPlaces(date: string): PlaceSlots {
  const saved = readJSON<PlaceSlots | null>(PREFIX + date, null);
  return saved && saved.length === SLOT_COUNT ? saved : emptyPlaces();
}

export function savePlaces(date: string, slots: PlaceSlots): void {
  writeJSON(PREFIX + date, slots, slots.every((p) => p === null));
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

export function knownOtherPlaces(): string[] {
  const all = keysWithPrefix(PREFIX).flatMap((key) =>
    readJSON<PlaceSlots>(key, []).filter(
      (p): p is string => p !== null && placeKind(p) === "other",
    ),
  );
  return rankByCount(all);
}
