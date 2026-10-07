"use client";

import { useState } from "react";
import { TimeRangeFields } from "@/components/TimeFields";
import { FIXED_PLACES, placeKind, type PlaceBlock } from "@/lib/places";

type Props = {
  initial: PlaceBlock;
  isNew: boolean;
  otherSuggestions: string[];
  onRangeChange: (start: number, end: number) => void;
  onSave: (block: PlaceBlock) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function PlaceForm({
  initial,
  isNew,
  otherSuggestions,
  onRangeChange,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const initialIsOther = initial.place !== "" && placeKind(initial.place) === "other";
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [choice, setChoice] = useState(initialIsOther ? "その他" : initial.place);
  const [other, setOther] = useState(initialIsOther ? initial.place : "");

  const place = choice === "その他" ? other.trim() : choice;
  const invalid = end <= start || place === "";

  function changeRange(nextStart: number, nextEnd: number) {
    setStart(nextStart);
    setEnd(nextEnd);
    onRangeChange(nextStart, nextEnd);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invalid) onSave({ place, start, end });
  }

  return (
    <form className="form" onSubmit={submit}>
      <TimeRangeFields start={start} end={end} onChange={changeRange} />
      <div className="choice-row" role="radiogroup" aria-label="場所">
        {[...FIXED_PLACES, "その他"].map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={choice === p}
            className={choice === p ? "tag tag-on" : "tag"}
            onClick={() => setChoice(p)}
          >
            {p}
          </button>
        ))}
      </div>
      {choice === "その他" && (
        <>
          <input
            className="text-input"
            aria-label="場所の名前"
            placeholder="場所の名前（例：カフェ、実家）"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
          {otherSuggestions.length > 0 && (
            <div className="tag-suggestions">
              {otherSuggestions.slice(0, 8).map((p) => (
                <button key={p} type="button" className="tag" onClick={() => setOther(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="form-actions">
        <button type="submit" className="primary" disabled={invalid}>
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
