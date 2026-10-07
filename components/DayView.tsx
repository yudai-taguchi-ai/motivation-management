"use client";

import { useState } from "react";
import CaffeineSection from "@/components/CaffeineSection";
import MoodChart, { type Preview } from "@/components/MoodChart";
import NotesSection from "@/components/NotesSection";
import PlacesSection from "@/components/PlacesSection";
import {
  DAY_END_MIN,
  DAY_START_MIN,
  emptyPoints,
  loadPoints,
  minuteLabel,
  savePoints,
  shiftKey,
  slotLabel,
  summarize,
  todayKey,
  weekdayLabel,
} from "@/lib/day";
import { loadCaffeine, saveCaffeine, upsertCaffeine, type Caffeine } from "@/lib/caffeine";
import {
  defaultRange,
  loadNotes,
  newId,
  nowMinutes,
  saveNotes,
  upsertNote,
  type Note,
} from "@/lib/notes";
import {
  loadPlaces,
  paintPlaces,
  placeBlocks,
  savePlaces,
  type PlaceBlock,
  type PlaceSlots,
} from "@/lib/places";

type Editor =
  | { type: "note"; note: Note; isNew: boolean }
  | { type: "place"; block: PlaceBlock; isNew: boolean }
  | { type: "caffeine"; item: Caffeine; isNew: boolean };

function newPlaceRange(isToday: boolean, slots: PlaceSlots): { start: number; end: number } {
  const blocks = placeBlocks(slots);
  const lastEnd = blocks.length ? blocks[blocks.length - 1].end : null;
  if (isToday) {
    const { end } = defaultRange(true);
    return { start: lastEnd !== null && lastEnd < end ? lastEnd : end - 60, end };
  }
  if (lastEnd !== null && lastEnd + 60 <= DAY_END_MIN) return { start: lastEnd, end: lastEnd + 60 };
  return { start: 9 * 60, end: 12 * 60 };
}

function newCaffeineTime(isToday: boolean): number {
  if (!isToday) return 9 * 60;
  const m = Math.floor(nowMinutes() / 5) * 5;
  return Math.min(DAY_END_MIN, Math.max(DAY_START_MIN, m));
}

export default function DayView() {
  const [date, setDate] = useState(todayKey);
  const [points, setPoints] = useState(() => loadPoints(todayKey()));
  const [notes, setNotes] = useState(() => loadNotes(todayKey()));
  const [places, setPlaces] = useState(() => loadPlaces(todayKey()));
  const [caffeine, setCaffeine] = useState(() => loadCaffeine(todayKey()));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const isToday = date === todayKey();
  const { average, max, min } = summarize(points);
  const blocks = placeBlocks(places);

  function moveTo(next: string) {
    setDate(next);
    setPoints(loadPoints(next));
    setNotes(loadNotes(next));
    setPlaces(loadPlaces(next));
    setCaffeine(loadCaffeine(next));
    close();
  }

  function open(next: Editor) {
    setEditor(next);
    if (next.type === "note") setPreview({ kind: "range", ...next.note });
    if (next.type === "place") setPreview({ kind: "range", ...next.block });
    if (next.type === "caffeine") setPreview({ kind: "point", at: next.item.at });
  }

  function close() {
    setEditor(null);
    setPreview(null);
  }

  function clear() {
    if (!confirm(`${date} の曲線を消しますか？（メモ・場所・カフェインは残ります）`)) return;
    const empty = emptyPoints();
    setPoints(empty);
    savePoints(date, empty);
  }

  function commitNotes(next: Note[]) {
    setNotes(next);
    saveNotes(date, next);
    close();
  }

  function commitPlaces(next: PlaceSlots) {
    setPlaces(next);
    savePlaces(date, next);
    close();
  }

  function commitCaffeine(next: Caffeine[]) {
    setCaffeine(next);
    saveCaffeine(date, next);
    close();
  }

  const updateRange = (start: number, end: number) => setPreview({ kind: "range", start, end });

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
        noteRanges={notes.filter((n) => !(editor?.type === "note" && editor.note.id === n.id))}
        places={blocks}
        placeSlots={places}
        caffeine={caffeine
          .filter((c) => !(editor?.type === "caffeine" && editor.item.id === c.id))
          .map((c) => c.at)}
        preview={preview}
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

      <NotesSection
        notes={notes}
        points={points}
        editing={editor?.type === "note" ? editor : null}
        canAdd={editor === null}
        onAdd={() =>
          open({
            type: "note",
            note: { id: newId(), body: "", tags: [], ...defaultRange(isToday) },
            isNew: true,
          })
        }
        onEdit={(note) => open({ type: "note", note, isNew: false })}
        onRangeChange={updateRange}
        onSave={(n) => commitNotes(upsertNote(notes, n))}
        onDelete={(id) => {
          if (confirm("このメモを削除しますか？")) commitNotes(notes.filter((n) => n.id !== id));
        }}
        onCancel={close}
      />

      <PlacesSection
        blocks={blocks}
        editing={editor?.type === "place" ? editor : null}
        canAdd={editor === null}
        onAdd={() =>
          open({
            type: "place",
            block: { place: "", ...newPlaceRange(isToday, places) },
            isNew: true,
          })
        }
        onEdit={(block) => open({ type: "place", block, isNew: false })}
        onRangeChange={updateRange}
        onSave={(b) => {
          const old = editor?.type === "place" && !editor.isNew ? editor.block : null;
          const cleared = old ? paintPlaces(places, old.start, old.end, null) : places;
          commitPlaces(paintPlaces(cleared, b.start, b.end, b.place));
        }}
        onDelete={(b) => {
          if (confirm(`${minuteLabel(b.start)}〜の「${b.place}」を削除しますか？`)) {
            commitPlaces(paintPlaces(places, b.start, b.end, null));
          }
        }}
        onCancel={close}
      />

      <CaffeineSection
        items={caffeine}
        editing={editor?.type === "caffeine" ? editor : null}
        canAdd={editor === null}
        onAdd={() =>
          open({
            type: "caffeine",
            item: { id: newId(), at: newCaffeineTime(isToday), label: "" },
            isNew: true,
          })
        }
        onEdit={(item) => open({ type: "caffeine", item, isNew: false })}
        onTimeChange={(at) => setPreview({ kind: "point", at })}
        onSave={(c) => commitCaffeine(upsertCaffeine(caffeine, c))}
        onDelete={(id) => {
          if (confirm("この記録を削除しますか？")) {
            commitCaffeine(caffeine.filter((c) => c.id !== id));
          }
        }}
        onCancel={close}
      />

      <button className="clear" onClick={clear} disabled={average === null}>
        この日の曲線を消す
      </button>
    </main>
  );
}
