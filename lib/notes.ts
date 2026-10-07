import { DAY_END_MIN, DAY_START_MIN, SLOT_MINUTES } from "@/lib/day";

export type Note = {
  id: string;
  start: number;
  end: number;
  body: string;
  tags: string[];
};

const PREFIX = "notes:";

export function loadNotes(date: string): Note[] {
  try {
    const raw = localStorage.getItem(PREFIX + date);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

export function saveNotes(date: string, notes: Note[]): void {
  try {
    if (notes.length === 0) {
      localStorage.removeItem(PREFIX + date);
      return;
    }
    localStorage.setItem(PREFIX + date, JSON.stringify(notes));
  } catch {}
}

export function upsertNote(notes: Note[], note: Note): Note[] {
  const rest = notes.filter((n) => n.id !== note.id);
  return [...rest, note].sort((a, b) => a.start - b.start || a.end - b.end);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim();
}

// よく使うタグほど先に並べる
export function knownTags(): string[] {
  const counts = new Map<string, number>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      for (const note of loadNotes(key.slice(PREFIX.length))) {
        for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  } catch {}
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}

export function defaultRange(isToday: boolean): { start: number; end: number } {
  if (!isToday) return { start: 12 * 60, end: 13 * 60 };
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < DAY_START_MIN) minutes += 24 * 60;
  const end = Math.min(
    DAY_END_MIN,
    Math.max(DAY_START_MIN + 60, Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES),
  );
  return { start: end - 60, end };
}
