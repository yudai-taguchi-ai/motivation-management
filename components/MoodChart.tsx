"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { DAY_END_MIN, DAY_START_MIN, SLOT_COUNT, slotLabel, type Points } from "@/lib/day";

const NARROW_QUERY = "(max-width: 600px)";
const PAD = { left: 40, right: 16, top: 16, bottom: 32 };

function makeLayout(narrow: boolean) {
  const W = narrow ? 400 : 800;
  const H = narrow ? 420 : 320;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  return {
    W,
    H,
    plotW,
    plotH,
    xOf: (slot: number) => PAD.left + (slot / SLOT_COUNT) * plotW,
    yOf: (value: number) => PAD.top + (1 - value / 100) * plotH,
    xOfMinute: (m: number) =>
      PAD.left + ((m - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * plotW,
  };
}

type Layout = ReturnType<typeof makeLayout>;

function subscribeNarrow(onChange: () => void) {
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function smoothPath(points: Points, { xOf, yOf }: Layout): string {
  const segments: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  points.forEach((value, slot) => {
    if (value === null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push({ x: xOf(slot), y: yOf(value) });
    }
  });
  if (current.length) segments.push(current);

  return segments
    .map((seg) => {
      if (seg.length === 1) {
        const p = seg[0];
        return `M${p.x - 2},${p.y}L${p.x + 2},${p.y}`;
      }
      let d = `M${seg[0].x},${seg[0].y}`;
      for (let i = 0; i < seg.length - 1; i++) {
        const p0 = seg[i - 1] ?? seg[i];
        const p1 = seg[i];
        const p2 = seg[i + 1];
        const p3 = seg[i + 2] ?? p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += `C${c1x},${c1y},${c2x},${c2y},${p2.x},${p2.y}`;
      }
      return d;
    })
    .join("");
}

type Range = { start: number; end: number };

type Props = {
  points: Points;
  ranges: Range[];
  activeRange: Range | null;
  onChange: (points: Points) => void;
  onCommit: (points: Points) => void;
};

export default function MoodChart({ points, ranges, activeRange, onChange, onCommit }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lastRef = useRef<{ slot: number; value: number } | null>(null);
  const pointsRef = useRef(points);
  const [drawing, setDrawing] = useState(false);
  const [cursor, setCursor] = useState<{ slot: number; value: number } | null>(null);
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
  const layout = makeLayout(narrow);
  const { W, H, plotW, plotH, xOf, yOf, xOfMinute } = layout;

  function readPointer(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const slot = Math.round(((p.x - PAD.left) / plotW) * SLOT_COUNT);
    const value = Math.round((1 - (p.y - PAD.top) / plotH) * 100);
    return {
      slot: Math.min(SLOT_COUNT - 1, Math.max(0, slot)),
      value: Math.min(100, Math.max(0, value)),
    };
  }

  function paint(to: { slot: number; value: number }) {
    const next = [...pointsRef.current];
    const from = lastRef.current ?? to;
    const steps = Math.abs(to.slot - from.slot);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 1 : i / steps;
      const slot = Math.round(from.slot + (to.slot - from.slot) * t);
      next[slot] = Math.round(from.value + (to.value - from.value) * t);
    }
    lastRef.current = to;
    pointsRef.current = next;
    onChange(next);
  }

  function handleDown(e: React.PointerEvent) {
    const p = readPointer(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointsRef.current = points;
    lastRef.current = null;
    setDrawing(true);
    setCursor(p);
    paint(p);
  }

  function handleMove(e: React.PointerEvent) {
    const p = readPointer(e);
    if (!p) return;
    if (drawing) {
      paint(p);
      setCursor(p);
    } else {
      const saved = points[p.slot];
      setCursor(saved === null ? null : { slot: p.slot, value: saved });
    }
  }

  function handleUp() {
    if (!drawing) return;
    setDrawing(false);
    lastRef.current = null;
    onCommit(pointsRef.current);
  }

  const hourTicks = [0, 3, 6, 9, 12, 15, 18, 20].map((h) => h * 4);

  return (
    <div className="chart">
      <div className="readout" aria-live="polite">
        {cursor ? (
          <>
            <span className="readout-time">{slotLabel(cursor.slot)}</span>
            <span className="readout-value">{cursor.value}</span>
          </>
        ) : (
          <span className="readout-hint">なぞって調子を描く</span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={() => !drawing && setCursor(null)}
      >
        {[...ranges, ...(activeRange ? [activeRange] : [])].map((r, i) => {
          const active = activeRange !== null && i === ranges.length;
          const x = xOfMinute(r.start);
          const w = xOfMinute(r.end) - x;
          return (
            <g key={i} className={active ? "band band-active" : "band"}>
              <rect x={x} y={PAD.top} width={w} height={plotH} className="band-fill" />
              <rect x={x} y={PAD.top + plotH - 6} width={w} height={6} className="band-mark" />
            </g>
          );
        })}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(v)}
              y2={yOf(v)}
              className={v === 50 ? "grid grid-mid" : "grid"}
            />
            <text x={PAD.left - 8} y={yOf(v)} className="label label-y">
              {v}
            </text>
          </g>
        ))}
        {hourTicks.map((slot) => (
          <g key={slot}>
            <line
              x1={xOf(slot)}
              x2={xOf(slot)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="grid"
            />
            <text
              x={xOf(slot)}
              y={H - PAD.bottom + 20}
              className="label label-x"
            >
              {slotLabel(slot).split(":")[0]}
            </text>
          </g>
        ))}
        <path d={smoothPath(points, layout)} className="curve" />
        {cursor && (
          <>
            <line
              x1={xOf(cursor.slot)}
              x2={xOf(cursor.slot)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="cursor-line"
            />
            <circle cx={xOf(cursor.slot)} cy={yOf(cursor.value)} r={5} className="cursor-dot" />
          </>
        )}
      </svg>
    </div>
  );
}
