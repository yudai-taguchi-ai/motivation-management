import { DAY_END_MIN, DAY_START_MIN, SLOT_MINUTES } from "@/lib/day";
import { keysWithPrefix, rankByCount, readJSON, writeJSON } from "@/lib/storage";

export { newId } from "@/lib/storage";

export type Note = {
  id: string;
  start: number;
  end: number;
  body: string;
  tags: string[];
};

const PREFIX = "notes:";

export function loadNotes(date: string): Note[] {
  return readJSON<Note[]>(PREFIX + date, []);
}

export function saveNotes(date: string, notes: Note[]): void {
  writeJSON(PREFIX + date, notes, notes.length === 0);
}

export function upsertNote(notes: Note[], note: Note): Note[] {
  const rest = notes.filter((n) => n.id !== note.id);
  return [...rest, note].sort((a, b) => a.start - b.start || a.end - b.end);
}

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim();
}

export function knownTags(): string[] {
  const all = keysWithPrefix(PREFIX).flatMap((key) =>
    readJSON<Note[]>(key, []).flatMap((n) => n.tags),
  );
  return rankByCount(all);
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
