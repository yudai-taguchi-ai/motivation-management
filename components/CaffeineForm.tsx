"use client";

import { useState } from "react";
import { TimeSelect } from "@/components/TimeFields";
import type { Caffeine } from "@/lib/caffeine";

type Props = {
  initial: Caffeine;
  isNew: boolean;
  suggestions: string[];
  onTimeChange: (at: number) => void;
  onSave: (item: Caffeine) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function CaffeineForm({
  initial,
  isNew,
  suggestions,
  onTimeChange,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [at, setAt] = useState(initial.at);
  const [label, setLabel] = useState(initial.label);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...initial, at, label: label.trim() });
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-range">
        <TimeSelect
          label="とった時刻"
          value={at}
          step={5}
          onChange={(m) => {
            setAt(m);
            onTimeChange(m);
          }}
        />
        <input
          className="text-input"
          aria-label="何をとったか"
          placeholder="何を（任意：コーヒー など）"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              className={label === s ? "tag tag-on" : "tag"}
              onClick={() => setLabel(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="primary">
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
