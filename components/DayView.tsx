"use client";

import { useState } from "react";
import MoodChart from "@/components/MoodChart";
import {
  emptyPoints,
  loadPoints,
  savePoints,
  shiftKey,
  slotLabel,
  summarize,
  todayKey,
  weekdayLabel,
} from "@/lib/day";

export default function DayView() {
  const [date, setDate] = useState(todayKey);
  const [points, setPoints] = useState(() => loadPoints(todayKey()));
  const isToday = date === todayKey();
  const { average, max, min } = summarize(points);

  function moveTo(next: string) {
    setDate(next);
    setPoints(loadPoints(next));
  }

  function clear() {
    if (!confirm(`${date} の曲線を消しますか？`)) return;
    const empty = emptyPoints();
    setPoints(empty);
    savePoints(date, empty);
  }

  return (
    <main className="day">
      <header className="day-header">
        <button className="nav" onClick={() => moveTo(shiftKey(date, -1))} aria-label="前の日">
          ←
        </button>
        <h1 className="day-title">
          {date.replaceAll("-", ".")} ({weekdayLabel(date)})
        </h1>
        <button
          className="nav"
          onClick={() => moveTo(shiftKey(date, 1))}
          disabled={isToday}
          aria-label="次の日"
        >
          →
        </button>
      </header>
      {!isToday && (
        <button className="link" onClick={() => moveTo(todayKey())}>
          今日に戻る
        </button>
      )}

      <MoodChart points={points} onChange={setPoints} onCommit={(p) => savePoints(date, p)} />

      <dl className="stats">
        <div>
          <dt>平均</dt>
          <dd>{average ?? "–"}</dd>
        </div>
        <div>
          <dt>最高</dt>
          <dd>{max ? `${max.value}` : "–"}<small>{max ? ` ${slotLabel(max.slot)}` : ""}</small></dd>
        </div>
        <div>
          <dt>最低</dt>
          <dd>{min ? `${min.value}` : "–"}<small>{min ? ` ${slotLabel(min.slot)}` : ""}</small></dd>
        </div>
      </dl>

      <button className="clear" onClick={clear} disabled={average === null}>
        この日の曲線を消す
      </button>
    </main>
  );
}
