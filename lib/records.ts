import { SLOT_COUNT, emptyPoints, type Points } from "@/lib/day";
import type { Caffeine } from "@/lib/caffeine";
import type { Note } from "@/lib/notes";
import { emptyPlaces, type PlaceSlots } from "@/lib/places";

export type DayRecord = {
  date: string;
  mood: Points;
  places: PlaceSlots;
  notes: Note[];
  caffeine: Caffeine[];
};

export type Days = Map<string, DayRecord>;

export function emptyRecord(date: string): DayRecord {
  return { date, mood: emptyPoints(), places: emptyPlaces(), notes: [], caffeine: [] };
}

export function normalizeRecord(raw: Partial<DayRecord> & { date: string }): DayRecord {
  return {
    date: raw.date,
    mood: raw.mood?.length === SLOT_COUNT ? raw.mood : emptyPoints(),
    places: raw.places?.length === SLOT_COUNT ? raw.places : emptyPlaces(),
    notes: raw.notes ?? [],
    caffeine: raw.caffeine ?? [],
  };
}

export function isEmptyRecord(r: DayRecord): boolean {
  return (
    r.mood.every((v) => v === null) &&
    r.places.every((p) => p === null) &&
    r.notes.length === 0 &&
    r.caffeine.length === 0
  );
}

export function recordOf(days: Days, date: string): DayRecord {
  return days.get(date) ?? emptyRecord(date);
}

// クラウド側を優先し、空いている枠と未登録の項目だけをこのブラウザの記録で埋める
export function mergeRecords(cloud: DayRecord, local: DayRecord): DayRecord {
  const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
  const noteIds = ids(cloud.notes);
  const caffeineIds = ids(cloud.caffeine);
  return {
    date: cloud.date,
    mood: cloud.mood.map((v, i) => v ?? local.mood[i]),
    places: cloud.places.map((p, i) => p ?? local.places[i]),
    notes: [...cloud.notes, ...local.notes.filter((n) => !noteIds.has(n.id))].sort(
      (a, b) => a.start - b.start,
    ),
    caffeine: [...cloud.caffeine, ...local.caffeine.filter((c) => !caffeineIds.has(c.id))].sort(
      (a, b) => a.at - b.at,
    ),
  };
}
