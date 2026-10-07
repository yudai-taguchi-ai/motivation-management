export const START_HOUR = 6;
export const END_HOUR = 26;
export const SLOT_MINUTES = 15;
export const SLOT_COUNT = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

export type Points = (number | null)[];

export function emptyPoints(): Points {
  return Array<number | null>(SLOT_COUNT).fill(null);
}

export const DAY_START_MIN = START_HOUR * 60;
export const DAY_END_MIN = END_HOUR * 60;

export function minuteLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function slotToMinute(slot: number): number {
  return DAY_START_MIN + slot * SLOT_MINUTES;
}

export function minuteToSlot(minutes: number): number {
  const slot = Math.floor((minutes - DAY_START_MIN) / SLOT_MINUTES);
  return Math.min(SLOT_COUNT - 1, Math.max(0, slot));
}

export function slotLabel(slot: number): string {
  return minuteLabel(slotToMinute(slot));
}

export function valueNear(points: Points, slot: number): number | null {
  for (let d = 0; d <= 2; d++) {
    const before = points[slot - d];
    if (before !== undefined && before !== null) return before;
    const after = points[slot + d];
    if (after !== undefined && after !== null) return after;
  }
  return null;
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
