"use client";

import CaffeineForm from "@/components/CaffeineForm";
import { minuteLabel } from "@/lib/day";
import type { Caffeine } from "@/lib/caffeine";

type Props = {
  suggestions: string[];
  items: Caffeine[];
  editing: { item: Caffeine; isNew: boolean } | null;
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (item: Caffeine) => void;
  onTimeChange: (at: number) => void;
  onSave: (item: Caffeine) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
};

export default function CaffeineSection(props: Props) {
  const { items, editing, canAdd } = props;

  function form(item: Caffeine, isNew: boolean) {
    return (
      <CaffeineForm
        key={item.id}
        initial={item}
        isNew={isNew}
        suggestions={props.suggestions}
        onTimeChange={props.onTimeChange}
        onSave={props.onSave}
        onDelete={() => props.onDelete(item.id)}
        onCancel={props.onCancel}
      />
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>カフェイン</h2>
        <button className="section-add" onClick={props.onAdd} disabled={!canAdd}>
          ＋ 追加
        </button>
      </div>
      {items.length === 0 && !editing && <p className="section-empty">まだありません</p>}
      <ul className="item-list">
        {items.map((c) => {
          if (editing?.item.id === c.id) return <li key={c.id}>{form(c, false)}</li>;
          return (
            <li key={c.id}>
              <button className="item" onClick={() => props.onEdit(c)} disabled={!canAdd}>
                <span className="item-time">{minuteLabel(c.at)}</span>
                {c.label && <span>{c.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {editing?.isNew && form(editing.item, true)}
    </section>
  );
}
