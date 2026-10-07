import { createClient } from "@supabase/supabase-js";
import { isEmptyRecord, normalizeRecord, type DayRecord } from "@/lib/records";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!,
);

const PAGE = 1000;

export async function fetchAllDays(): Promise<DayRecord[]> {
  const all: DayRecord[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("days")
      .select("date, mood, places, notes, caffeine")
      .order("date")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data.map((row) => normalizeRecord(row)));
    if (data.length < PAGE) return all;
  }
}

export async function saveDay(record: DayRecord): Promise<void> {
  if (isEmptyRecord(record)) {
    const { error } = await supabase.from("days").delete().eq("date", record.date);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("days")
    .upsert({ ...record, updated_at: new Date().toISOString() }, { onConflict: "user_id,date" });
  if (error) throw error;
}
