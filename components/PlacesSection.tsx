"use client";

import PlaceForm from "@/components/PlaceForm";
import { minuteLabel } from "@/lib/day";
import { knownOtherPlaces, type PlaceBlock } from "@/lib/places";

type Props = {
  blocks: PlaceBlock[];
  editing: { block: PlaceBlock; isNew: boolean } | null;
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (block: PlaceBlock) => void;
  onRangeChange: (start: number, end: number) => void;
  onSave: (block: PlaceBlock) => void;
  onDelete: (block: PlaceBlock) => void;
  onCancel: () => void;
};

export default function PlacesSection(props: Props) {
  const { blocks, editing, canAdd } = props;

  function form(block: PlaceBlock, isNew: boolean) {
    return (
      <PlaceForm
        key={`${block.start}-${isNew}`}
        initial={block}
        isNew={isNew}
        otherSuggestions={knownOtherPlaces()}
        onRangeChange={props.onRangeChange}
        onSave={props.onSave}
        onDelete={() => props.onDelete(block)}
        onCancel={props.onCancel}
      />
    );
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>場所</h2>
        <button className="section-add" onClick={props.onAdd} disabled={!canAdd}>
          ＋ 追加
        </button>
      </div>
      {blocks.length === 0 && !editing && <p className="section-empty">まだありません</p>}
      <ul className="item-list">
        {blocks.map((b) => {
          if (editing && !editing.isNew && editing.block.start === b.start) {
            return <li key={b.start}>{form(b, false)}</li>;
          }
          return (
            <li key={b.start}>
              <button className="item" onClick={() => props.onEdit(b)} disabled={!canAdd}>
                <span className="item-time">
                  {minuteLabel(b.start)}–{minuteLabel(b.end)}
                </span>
                <span>{b.place}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {editing?.isNew && form(editing.block, true)}
    </section>
  );
}
