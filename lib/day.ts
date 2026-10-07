export const START_HOUR = 6;
export const END_HOUR = 26;
export const SLOT_MINUTES = 15;
export const SLOT_COUNT = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

export type Points = (number | null)[];

export function emptyPoints(): Points {
  return Array<number | null>(SLOT_COUNT).fill(null);
}

export function slotLabel(slot: number): string {
  const minutes = START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 深夜2時までは前日として扱う
export function todayKey(): string {
  const d = new Date();
  d.setHours(d.getHours() - (END_HOUR - 24));
  return toKey(d);
}

export function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + days));
}

export function weekdayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return "日月火水木金土"[new Date(y, m - 1, d).getDay()];
}

const storageKey = (date: string) => `mood:${date}`;

export function loadPoints(date: string): Points {
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (!raw) return emptyPoints();
    const saved = JSON.parse(raw) as { points: Points };
    return saved.points.length === SLOT_COUNT ? saved.points : emptyPoints();
  } catch {
    return emptyPoints();
  }
}

export function savePoints(date: string, points: Points): void {
  try {
    if (points.every((p) => p === null)) {
      localStorage.removeItem(storageKey(date));
      return;
    }
    localStorage.setItem(
      storageKey(date),
      JSON.stringify({ points, updatedAt: new Date().toISOString() }),
    );
  } catch {}
}

type Peak = { slot: number; value: number };

export function summarize(points: Points) {
  let sum = 0;
  let count = 0;
  let max: Peak | null = null;
  let min: Peak | null = null;
  for (let slot = 0; slot < points.length; slot++) {
    const value = points[slot];
    if (value === null) continue;
    sum += value;
    count++;
    if (!max || value > max.value) max = { slot, value };
    if (!min || value < min.value) min = { slot, value };
  }
  return { average: count ? Math.round(sum / count) : null, max, min };
}
