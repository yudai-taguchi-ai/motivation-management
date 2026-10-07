"use client";

import { DAY_END_MIN, DAY_START_MIN, SLOT_MINUTES, minuteLabel } from "@/lib/day";

function options(step: number, from: number, to: number): number[] {
  const list: number[] = [];
  for (let m = from; m <= to; m += step) list.push(m);
  return list;
}

type TimeSelectProps = {
  label: string;
  value: number;
  step: number;
  from?: number;
  to?: number;
  onChange: (minutes: number) => void;
};

export function TimeSelect({
  label,
  value,
  step,
  from = DAY_START_MIN,
  to = DAY_END_MIN,
  onChange,
}: TimeSelectProps) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {options(step, from, to).map((m) => (
        <option key={m} value={m}>
          {minuteLabel(m)}
        </option>
      ))}
    </select>
  );
}

type RangeProps = {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
};

export function TimeRangeFields({ start, end, onChange }: RangeProps) {
  return (
    <>
      <div className="form-range">
        <TimeSelect
          label="始まり"
          value={start}
          step={SLOT_MINUTES}
          to={DAY_END_MIN - SLOT_MINUTES}
          onChange={(m) => onChange(m, end)}
        />
        <span>〜</span>
        <TimeSelect
          label="終わり"
          value={end}
          step={SLOT_MINUTES}
          from={DAY_START_MIN + SLOT_MINUTES}
          onChange={(m) => onChange(start, m)}
        />
      </div>
      {end <= start && <p className="form-error">終わりは始まりより後にしてください</p>}
    </>
  );
}
