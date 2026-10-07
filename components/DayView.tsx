"use client";

import { useState } from "react";
import MoodChart from "@/components/MoodChart";
import NoteForm from "@/components/NoteForm";
import {
  emptyPoints,
  loadPoints,
  minuteLabel,
  minuteToSlot,
  savePoints,
  shiftKey,
  slotLabel,
  summarize,
  todayKey,
  valueNear,
  weekdayLabel,
  type Points,
} from "@/lib/day";
import {
  defaultRange,
  knownTags,
  loadNotes,
  newId,
  saveNotes,
  upsertNote,
  type Note,
} from "@/lib/notes";

type Editing = { note: Note; isNew: boolean; start: number; end: number };

function change(points: Points, note: Note) {
  const before = valueNear(points, minuteToSlot(note.start));
  const after = valueNear(points, minuteToSlot(note.end));
  if (before === null || after === null) return null;
  return { before, after, diff: after - before };
}

export default function DayView() {
  const [date, setDate] = useState(todayKey);
  const [points, setPoints] = useState(() => loadPoints(todayKey()));
  const [notes, setNotes] = useState(() => loadNotes(todayKey()));
  const [editing, setEditing] = useState<Editing | null>(null);
  const isToday = date === todayKey();
  const { average, max, min } = summarize(points);

  function moveTo(next: string) {
    setDate(next);
    setPoints(loadPoints(next));
    setNotes(loadNotes(next));
    setEditing(null);
  }

  function clear() {
    if (!confirm(`${date} の曲線を消しますか？（メモは残ります）`)) return;
    const empty = emptyPoints();
    setPoints(empty);
    savePoints(date, empty);
  }

  function startNew() {
    const range = defaultRange(isToday);
    setEditing({
      note: { id: newId(), body: "", tags: [], ...range },
      isNew: true,
      ...range,
    });
  }

  function persist(next: Note[]) {
    setNotes(next);
    saveNotes(date, next);
    setEditing(null);
  }

  function remove(id: string) {
    if (!confirm("このメモを削除しますか？")) return;
    persist(notes.filter((n) => n.id !== id));
  }

  const visibleNotes = notes.filter((n) => n.id !== editing?.note.id);

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

      <MoodChart
        points={points}
        ranges={visibleNotes}
        activeRange={editing ? { start: editing.start, end: editing.end } : null}
        onChange={setPoints}
        onCommit={(p) => savePoints(date, p)}
      />

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

      <section className="notes">
        <h2 className="notes-title">メモ</h2>
        {notes.length === 0 && !editing && (
          <p className="notes-empty">この日のメモはまだありません</p>
        )}
        <ul className="note-list">
          {notes.map((note) => {
            if (editing?.note.id === note.id) {
              return (
                <li key={note.id}>
                  <NoteForm
                    initial={note}
                    isNew={false}
                    suggestions={knownTags()}
                    onRangeChange={(start, end) => setEditing({ ...editing, start, end })}
                    onSave={(n) => persist(upsertNote(notes, n))}
                    onDelete={() => remove(note.id)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              );
            }
            const c = change(points, note);
            return (
              <li key={note.id}>
                <button
                  className="note-item"
                  onClick={() =>
                    setEditing({ note, isNew: false, start: note.start, end: note.end })
                  }
                >
                  <span className="note-time">
                    {minuteLabel(note.start)}–{minuteLabel(note.end)}
                  </span>
                  {c && (
                    <span className="note-change">
                      {c.before}→{c.after}{" "}
                      <strong>{c.diff > 0 ? `+${c.diff}` : c.diff}</strong>
                    </span>
                  )}
                  {note.body && <span className="note-body">{note.body}</span>}
                  {note.tags.length > 0 && (
                    <span className="note-tags">{note.tags.map((t) => `#${t}`).join(" ")}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {editing?.isNew ? (
          <NoteForm
            key={editing.note.id}
            initial={editing.note}
            isNew
            suggestions={knownTags()}
            onRangeChange={(start, end) => setEditing({ ...editing, start, end })}
            onSave={(n) => persist(upsertNote(notes, n))}
            onDelete={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          !editing && (
            <button className="add-note" onClick={startNew}>
              ＋ メモを追加
            </button>
          )
        )}
      </section>

      <button className="clear" onClick={clear} disabled={average === null}>
        この日の曲線を消す
      </button>
    </main>
  );
}
