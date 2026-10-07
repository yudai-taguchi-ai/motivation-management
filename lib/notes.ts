import { DAY_END_MIN, DAY_START_MIN, SLOT_MINUTES } from "@/lib/day";
import type { DayRecord } from "@/lib/records";
import { rankByCount } from "@/lib/storage";

export { newId } from "@/lib/storage";

export type Note = {
  id: string;
  start: number;
  end: number;
  body: string;
  tags: string[];
};

export function upsertNote(notes: Note[], note: Note): Note[] {
  const rest = notes.filter((n) => n.id !== note.id);
  return [...rest, note].sort((a, b) => a.start - b.start || a.end - b.end);
}

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim();
}

export function knownTags(records: DayRecord[]): string[] {
  return rankByCount(records.flatMap((r) => r.notes.flatMap((n) => n.tags)));
}

export function nowMinutes(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes < DAY_START_MIN ? minutes + 24 * 60 : minutes;
}

export function defaultRange(isToday: boolean): { start: number; end: number } {
  if (!isToday) return { start: 12 * 60, end: 13 * 60 };
  const end = Math.min(
    DAY_END_MIN,
    Math.max(DAY_START_MIN + 60, Math.floor(nowMinutes() / SLOT_MINUTES) * SLOT_MINUTES),
  );
  return { start: end - 60, end };
}
