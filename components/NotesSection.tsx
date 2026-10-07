"use client";

import NoteForm from "@/components/NoteForm";
import { minuteLabel, minuteToSlot, valueNear, type Points } from "@/lib/day";
import type { Note } from "@/lib/notes";

function change(points: Points, note: Note) {
  const before = valueNear(points, minuteToSlot(note.start));
  const after = valueNear(points, minuteToSlot(note.end));
  if (before === null || after === null) return null;
  return { before, after, diff: after - before };
}

type Props = {
  suggestions: string[];
  notes: Note[];
  points: Points;
  editing: { note: Note; isNew: boolean } | null;
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (note: Note) => void;
  onRangeChange: (start: number, end: number) => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
};

export default function NotesSection(props: Props) {
  const { notes, points, editing, canAdd } = props;

  function form(note: Note, isNew: boolean) {
    return (
      <NoteForm
        key={note.id}
        initial={note}
        isNew={isNew}
        suggestions={props.suggestions}
        onRangeChange={props.onRangeChange}
        onSave={props.onSave}
        onDelete={() => props.onDelete(note.id)}
        onCancel={props.onCancel}
      />
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>メモ</h2>
        <button className="section-add" onClick={props.onAdd} disabled={!canAdd}>
          ＋ 追加
        </button>
      </div>
      {notes.length === 0 && !editing && <p className="section-empty">まだありません</p>}
      <ul className="item-list">
        {notes.map((note) => {
          if (editing?.note.id === note.id) return <li key={note.id}>{form(note, false)}</li>;
          const c = change(points, note);
          return (
            <li key={note.id}>
              <button className="item" onClick={() => props.onEdit(note)} disabled={!canAdd}>
                <span className="item-time">
                  {minuteLabel(note.start)}–{minuteLabel(note.end)}
                </span>
                {c && (
                  <span className="item-sub">
                    {c.before}→{c.after} <strong>{c.diff > 0 ? `+${c.diff}` : c.diff}</strong>
                  </span>
                )}
                {note.body && <span className="item-body">{note.body}</span>}
                {note.tags.length > 0 && (
                  <span className="item-tags">{note.tags.map((t) => `#${t}`).join(" ")}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {editing?.isNew && form(editing.note, true)}
    </section>
  );
}
