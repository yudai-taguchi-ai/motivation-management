"use client";

import { useState } from "react";
import { DAY_END_MIN, DAY_START_MIN, SLOT_MINUTES, minuteLabel } from "@/lib/day";
import { normalizeTag, type Note } from "@/lib/notes";

const TIME_OPTIONS: number[] = [];
for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += SLOT_MINUTES) TIME_OPTIONS.push(m);

const TAG_SEPARATOR = /[,、\s　]+/;

type Props = {
  initial: Note;
  isNew: boolean;
  suggestions: string[];
  onRangeChange: (start: number, end: number) => void;
  onSave: (note: Note) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function NoteForm({
  initial,
  isNew,
  suggestions,
  onRangeChange,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [body, setBody] = useState(initial.body);
  const [tags, setTags] = useState(initial.tags);
  const [tagInput, setTagInput] = useState("");

  const rangeError = end <= start ? "終わりは始まりより後にしてください" : null;
  const empty = body.trim() === "" && tags.length === 0 && normalizeTag(tagInput) === "";

  function changeRange(nextStart: number, nextEnd: number) {
    setStart(nextStart);
    setEnd(nextEnd);
    onRangeChange(nextStart, nextEnd);
  }

  function addTags(raw: string[]) {
    const added = raw.map(normalizeTag).filter((t) => t !== "");
    setTags((prev) => [...prev, ...added.filter((t, i) => !prev.includes(t) && added.indexOf(t) === i)]);
  }

  function handleTagInput(value: string) {
    const parts = value.split(TAG_SEPARATOR);
    if (parts.length > 1) {
      addTags(parts.slice(0, -1));
      setTagInput(parts[parts.length - 1]);
    } else {
      setTagInput(value);
    }
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      addTags([tagInput]);
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rangeError || empty) return;
    const pending = normalizeTag(tagInput);
    const finalTags = pending && !tags.includes(pending) ? [...tags, pending] : tags;
    onSave({ ...initial, start, end, body: body.trim(), tags: finalTags });
  }

  const unused = suggestions.filter((t) => !tags.includes(t)).slice(0, 12);

  return (
    <form className="note-form" onSubmit={submit}>
      <div className="note-form-range">
        <select
          aria-label="始まり"
          value={start}
          onChange={(e) => changeRange(Number(e.target.value), end)}
        >
          {TIME_OPTIONS.slice(0, -1).map((m) => (
            <option key={m} value={m}>
              {minuteLabel(m)}
            </option>
          ))}
        </select>
        <span>〜</span>
        <select
          aria-label="終わり"
          value={end}
          onChange={(e) => changeRange(start, Number(e.target.value))}
        >
          {TIME_OPTIONS.slice(1).map((m) => (
            <option key={m} value={m}>
              {minuteLabel(m)}
            </option>
          ))}
        </select>
      </div>
      {rangeError && <p className="note-form-error">{rangeError}</p>}

      <textarea
        aria-label="何をしたか"
        placeholder="何をしたか"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
      />

      <div className="tag-field">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            className="tag tag-on"
            onClick={() => setTags(tags.filter((x) => x !== t))}
            aria-label={`${t} を外す`}
          >
            #{t} ×
          </button>
        ))}
        <input
          aria-label="タグ"
          placeholder={tags.length ? "" : "タグ（Enter で追加）"}
          value={tagInput}
          onChange={(e) => handleTagInput(e.target.value)}
          onKeyDown={handleTagKey}
        />
      </div>
      {unused.length > 0 && (
        <div className="tag-suggestions">
          {unused.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => addTags([t])}>
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="note-form-actions">
        <button type="submit" className="primary" disabled={!!rangeError || empty}>
          保存
        </button>
        <button type="button" onClick={onCancel}>
          やめる
        </button>
        {!isNew && (
          <button type="button" className="danger" onClick={onDelete}>
            削除
          </button>
        )}
      </div>
    </form>
  );
}
