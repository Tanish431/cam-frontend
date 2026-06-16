"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, GitBranch, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── fix hydration: stable random via seeded generation ────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ── animated background ───────────────────────────────────────────────────────
function CorrelationGrid() {
  const rand = seededRandom(42);
  const initial = Array.from({ length: 8 }, () =>
    Array.from({ length: 14 }, () => rand() * 2 - 1),
  );
  const [values, setValues] = useState(initial);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) =>
        prev.map((row) =>
          row.map((v) =>
            Math.max(-1, Math.min(1, v + (Math.random() - 0.5) * 0.06)),
          ),
        ),
      );
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-[0.055]">
        {values.map((row, i) => (
          <div key={i} className="flex gap-4">
            {row.map((v, j) => (
              <span
                key={j}
                className="text-xs font-mono tabular-nums transition-colors duration-[1200ms]"
                style={{
                  color:
                    v > 0
                      ? `rgba(74,222,128,${Math.abs(v)})`
                      : `rgba(248,113,113,${Math.abs(v)})`,
                }}
              >
                {v.toFixed(2)}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 0%, rgb(15,14,13) 70%)",
        }}
      />
    </div>
  );
}

// ── vertical timeline ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "01",
    label: "Ingest",
    color: "#4f8ef7",
    desc: "Daily OHLCV from Yahoo Finance, FRED macro series, CoinGecko. 8 asset classes, scheduled at 2AM IST.",
  },
  {
    id: "02",
    label: "Normalize",
    color: "#818cf8",
    desc: "Log-returns computed per asset. Published to Kafka topic raw-prices → normalized-series.",
  },
  {
    id: "03",
    label: "Correlate",
    color: "#a78bfa",
    desc: "Rolling Pearson across all 28 pairs at 20d, 60d, 252d. Z-scored against full 2-year history.",
  },
  {
    id: "04",
    label: "Cluster",
    color: "#c084fc",
    desc: "K-Means on Z-score vectors finds 4 market regimes. Episode detection groups consecutive anomalies into single signals.",
  },
  {
    id: "05",
    label: "Signal",
    color: "#e879f9",
    desc: "CTA trend + momentum scores. Risk premia rankings. Factor exposure via OLS regression. PCA regime space.",
  },
  {
    id: "06",
    label: "Alert",
    color: "#f472b6",
    desc: "Discord webhook + email fire at |z| > 2σ. Change-point detection (PELT algorithm) finds exact break dates.",
  },
];

function TimelineStep({
  step,
  index,
}: {
  step: (typeof STEPS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="flex gap-6 items-start"
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    >
      {/* left: number + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full border flex items-center justify-center
          text-xs font-mono font-bold flex-shrink-0 transition-all duration-500"
          style={{
            borderColor: inView ? step.color : "rgb(46 44 42)",
            color: inView ? step.color : "rgb(92 90 87)",
            boxShadow: inView ? `0 0 16px ${step.color}40` : "none",
          }}
        >
          {step.id}
        </div>
        {index < STEPS.length - 1 && (
          <motion.div
            className="w-px flex-1 mt-2"
            style={{ minHeight: 48 }}
            initial={{
              scaleY: 0,
              originY: 0,
              backgroundColor: "rgb(46 44 42)",
            }}
            animate={
              inView ? { scaleY: 1, backgroundColor: step.color + "40" } : {}
            }
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        )}
      </div>

      {/* right: content */}
      <div className="pb-10">
        <p className="font-semibold text-foreground text-base mb-1">
          {step.label}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ── bento vizzes ──────────────────────────────────────────────────────────────
function ZScoreViz() {
  const rand = seededRandom(99);
  const points = Array.from(
    { length: 80 },
    (_, i) => Math.sin(i * 0.12) * 1.2 + (rand() - 0.5) * 0.8,
  );
  const max = Math.max(...points);
  const min = Math.min(...points);
  const ny = (v: number) => 90 - ((v - min) / (max - min)) * 70 - 10;
  const w = 340 / points.length;

  return (
    <div className="flex-1 flex flex-col justify-end pt-4">
      <svg viewBox="0 0 340 100" className="w-full">
        <line
          x1="0"
          y1={ny(0)}
          x2="340"
          y2={ny(0)}
          stroke="rgb(92 90 87)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
        />
        <line
          x1="0"
          y1={ny(2)}
          x2="340"
          y2={ny(2)}
          stroke="#ef4444"
          strokeWidth="0.5"
          strokeOpacity="0.35"
        />
        <line
          x1="0"
          y1={ny(-2)}
          x2="340"
          y2={ny(-2)}
          stroke="#ef4444"
          strokeWidth="0.5"
          strokeOpacity="0.35"
        />
        <polyline
          points={points.map((p, i) => `${i * w + w / 2},${ny(p)}`).join(" ")}
          fill="none"
          stroke="#4f8ef7"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {points.map((p, i) =>
          Math.abs(p) > 2 ? (
            <circle
              key={i}
              cx={i * w + w / 2}
              cy={ny(p)}
              r={3}
              fill="#ef4444"
              fillOpacity={0.9}
            />
          ) : null,
        )}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-muted-foreground font-mono">
          -2σ threshold
        </span>
        <span className="text-[10px] text-red-400 font-mono">● anomaly</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          +2σ threshold
        </span>
      </div>
    </div>
  );
}

function NetworkViz() {
  const nodes = [
    { x: 80, y: 60, c: "#22c55e", r: 14, label: "SPY" },
    { x: 200, y: 40, c: "#4f8ef7", r: 11, label: "TLT" },
    { x: 270, y: 110, c: "#f59e0b", r: 10, label: "GLD" },
    { x: 160, y: 140, c: "#f97316", r: 16, label: "BTC" },
    { x: 50, y: 140, c: "#22c55e", r: 9, label: "DXY" },
    { x: 230, y: 190, c: "#4f8ef7", r: 11, label: "QQQ" },
    { x: 100, y: 190, c: "#ef4444", r: 13, label: "VIX" },
  ];
  const edges: [number, number, number, boolean][] = [
    [0, 1, 0.7, false],
    [0, 3, 0.5, true],
    [1, 2, 0.85, false],
    [2, 3, 0.4, false],
    [3, 4, 0.6, true],
    [3, 5, 0.35, false],
    [4, 6, 0.55, false],
    [5, 6, 0.75, false],
    [0, 5, 0.9, false],
  ];

  return (
    <div className="flex-1 flex flex-col justify-center">
      <svg viewBox="0 0 320 240" className="w-full">
        {edges.map(([a, b, w, anomalous], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={anomalous ? "#ef4444" : "#4f8ef7"}
            strokeWidth={w * 3}
            strokeOpacity={w * 0.5}
            strokeDasharray={anomalous ? "4 3" : undefined}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r + 4}
              fill={n.c}
              fillOpacity={0.08}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.c}
              fillOpacity={0.85}
              stroke="rgb(26 25 23)"
              strokeWidth={2}
            />
            <text
              x={n.x}
              y={n.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily="monospace"
              fontWeight="700"
              fill="white"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex gap-4 px-1 mt-1">
        <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
          <span className="inline-block w-3 h-px bg-blue-400" />
          positive corr
        </span>
        <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
          <span
            className="inline-block w-3 h-px bg-red-400"
            style={{ borderTop: "1px dashed #f87171" }}
          />
          anomalous
        </span>
      </div>
    </div>
  );
}

function HeatmapViz() {
  const rand = seededRandom(7);
  const symbols = ["SPY", "QQQ", "GLD", "TLT", "BTC", "DXY", "USO", "VIX"];
  const n = symbols.length;
  const matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1;
      return rand() * 2 - 1;
    }),
  );

  const anomalies = new Set(["0-3", "3-0", "1-4", "4-1", "2-6", "6-2"]);

  return (
    <div className="flex-1 flex flex-col justify-center gap-1 pt-2">
      {/* col headers */}
      <div className="flex gap-0.5 ml-8">
        {symbols.map((s) => (
          <div
            key={s}
            className="flex-1 text-center text-[8px] font-mono
            text-muted-foreground truncate"
          >
            {s}
          </div>
        ))}
      </div>
      {matrix.map((row, i) => (
        <div key={i} className="flex gap-0.5 items-center">
          <div
            className="w-7 text-[8px] font-mono text-muted-foreground
            text-right pr-1 flex-shrink-0"
          >
            {symbols[i]}
          </div>
          {row.map((v, j) => {
            const isAnomaly = anomalies.has(`${i}-${j}`);
            return (
              <div
                key={j}
                className="flex-1 h-5 rounded-sm relative"
                style={{
                  background:
                    i === j
                      ? "rgb(46 44 42)"
                      : v > 0
                        ? `rgba(74,222,128,${Math.abs(v) * 0.85})`
                        : `rgba(248,113,113,${Math.abs(v) * 0.85})`,
                  outline: isAnomaly ? "1.5px solid #ef4444" : "none",
                  outlineOffset: "-1px",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PCAViz() {
  const rand = seededRandom(13);
  const clusters = [
    { cx: 80, cy: 70, c: "#22c55e", n: 35 },
    { cx: 200, cy: 55, c: "#4f8ef7", n: 30 },
    { cx: 70, cy: 160, c: "#f59e0b", n: 25 },
    { cx: 200, cy: 165, c: "#f97316", n: 40 },
  ];
  const points = clusters.flatMap((cl) =>
    Array.from({ length: cl.n }, () => ({
      x: cl.cx + (rand() - 0.5) * 60,
      y: cl.cy + (rand() - 0.5) * 50,
      c: cl.c,
    })),
  );

  return (
    <div className="flex-1 flex flex-col justify-center">
      <svg viewBox="0 0 300 230" className="w-full">
        <line
          x1="15"
          y1="115"
          x2="285"
          y2="115"
          stroke="rgb(46 44 42)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
        />
        <line
          x1="150"
          y1="10"
          x2="150"
          y2="220"
          stroke="rgb(46 44 42)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill={p.c}
            fillOpacity={0.65}
          />
        ))}
        {/* today marker */}
        <circle
          cx={215}
          cy={172}
          r={7}
          fill="#f97316"
          stroke="white"
          strokeWidth={2}
        />
        <text
          x={224}
          y={163}
          fontSize="8"
          fill="white"
          fontFamily="monospace"
          fontWeight="bold"
        >
          TODAY
        </text>
        {/* trajectory arrow */}
        <polyline
          points="175,145 190,158 215,165"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
          markerEnd="url(#arrow)"
        />
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 6 6"
            refX="3"
            refY="3"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6z" fill="rgba(255,255,255,0.4)" />
          </marker>
        </defs>
      </svg>
      <div className="flex gap-3 flex-wrap px-1 mt-1">
        {clusters.map((cl, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: cl.c }}
            />
            <span className="text-[9px] text-muted-foreground font-mono">
              {["Risk-On", "Divergence", "Mild Stress", "Regime Break"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StressViz() {
  const regimes = ["Risk-On", "Mild Stress", "Divergence", "Regime Break"];
  const colors = ["#22c55e", "#4f8ef7", "#f59e0b", "#f97316"];
  const vols = [0.11, 0.17, 0.14, 0.24];
  const current = 0.19;
  const maxVol = 0.28;

  const portfolio = [
    { symbol: "SPY", weight: 0.4, color: "#4f8ef7" },
    { symbol: "TLT", weight: 0.3, color: "#22c55e" },
    { symbol: "GLD", weight: 0.2, color: "#f59e0b" },
    { symbol: "BTC", weight: 0.1, color: "#f97316" },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between gap-3 pt-3">
      {/* portfolio weights */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
        {portfolio.map((p) => (
          <div
            key={p.symbol}
            className="h-full transition-all"
            style={{ width: `${p.weight * 100}%`, background: p.color }}
            title={`${p.symbol} ${p.weight * 100}%`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {portfolio.map((p) => (
          <div key={p.symbol} className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {p.symbol} {p.weight * 100}%
            </span>
          </div>
        ))}
      </div>

      {/* vol by regime bars */}
      <div className="space-y-2">
        {regimes.map((r, i) => (
          <div key={r} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-20 flex-shrink-0">
              {r}
            </span>
            <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(vols[i] / maxVol) * 100}%`,
                  background: colors[i],
                  opacity: 0.8,
                }}
              />
            </div>
            <span
              className="text-[10px] font-mono w-8 text-right"
              style={{ color: colors[i] }}
            >
              {(vols[i] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* current vol */}
      <div
        className="flex items-center justify-between bg-orange-500/10
        border border-orange-500/20 rounded-lg px-3 py-2"
      >
        <span className="text-xs text-muted-foreground">
          Current portfolio vol
        </span>
        <span className="text-sm font-mono font-bold text-orange-400">
          {(current * 100).toFixed(1)}%
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Diversification ratio:{" "}
        <span className="text-foreground font-mono">1.31×</span>
        {" · "}undiversified: <span className="font-mono">24.9%</span>
      </p>
    </div>
  );
}

function RegimeTimelineViz() {
  const rand = seededRandom(55);
  const regimes = [
    0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2, 2, 1, 0, 0, 0, 3, 3, 3, 3, 3, 2,
  ];
  const colors = ["#22c55e", "#4f8ef7", "#f59e0b", "#f97316"];
  const labels = ["Risk-On", "Divergence", "Mild Stress", "Regime Break"];

  return (
    <div className="flex-1 flex flex-col justify-center gap-3">
      {/* timeline blocks */}
      <div className="flex gap-0.5 items-end">
        {regimes.map((r, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${28 + rand() * 16}px`,
              background: colors[r],
              opacity: 0.7 + (i / regimes.length) * 0.3,
            }}
            title={labels[r]}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">
          2 years ago
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          today →
        </span>
      </div>
      {/* current */}
      <div
        className="flex items-center gap-2 bg-orange-500/10 border
        border-orange-500/20 rounded-lg px-3 py-2"
      >
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-xs font-semibold text-orange-400">
          Regime Break
        </span>
        <span className="text-xs text-muted-foreground ml-auto">current</span>
      </div>
    </div>
  );
}

// ── bento grid ────────────────────────────────────────────────────────────────
const BENTO_ITEMS = [
  {
    id: "regime",
    col: "col-span-7",
    row: "row-span-1",
    title: "Regime Detection",
    sub: "Z-score of rolling correlation — anomalies flagged at ±2σ",
    viz: <ZScoreViz />,
  },
  {
    id: "network",
    col: "col-span-5",
    row: "row-span-2",
    title: "Correlation Network",
    sub: "Force-directed graph. Node size = degree centrality",
    viz: <NetworkViz />,
  },
  {
    id: "heatmap",
    col: "col-span-4",
    row: "row-span-1",
    title: "Correlation Matrix",
    sub: "Full 8×8 heatmap · red outline = |z| > 2σ",
    viz: <HeatmapViz />,
  },
  {
    id: "regime-timeline",
    col: "col-span-3",
    row: "row-span-1",
    title: "Regime Timeline",
    sub: "K-Means cluster history over 2 years",
    viz: <RegimeTimelineViz />,
  },
  {
    id: "pca",
    col: "col-span-7",
    row: "row-span-1",
    title: "Regime Space (PCA)",
    sub: "2D projection of the full Z-score vector · trajectory shows market movement",
    viz: <PCAViz />,
  },
  {
    id: "stress",
    col: "col-span-5",
    row: "row-span-1",
    title: "Portfolio Stress Test",
    sub: "Correlation-adjusted vol across regimes",
    viz: <StressViz />,
  },
];

function BentoCard({
  item,
  index,
}: {
  item: (typeof BENTO_ITEMS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={`
        ${item.col} ${item.row}
        bg-card border border-border rounded-2xl p-5
        flex flex-col overflow-hidden min-h-[220px]
        hover:border-border/80 transition-all duration-300
        relative group
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.45, ease: "easeOut" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100
        transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(79 142 247 / 0.3), transparent)",
        }}
      />
      <div className="flex-shrink-0">
        <p className="font-semibold text-foreground text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
      </div>
      {item.viz}
    </motion.div>
  );
}

// ── math section ──────────────────────────────────────────────────────────────
const MATH = [
  {
    label: "Rolling Pearson",
    formula: "r_t = (nΣxy − ΣxΣy) / √[(nΣx²−(Σx)²)(nΣy²−(Σy)²)]",
    desc: "Computed over 20, 60, and 252-day sliding windows for every asset pair. Gives a time-varying relationship series — not a static number.",
    tag: "correlation engine",
  },
  {
    label: "Z-Score Anomaly",
    formula: "z_t = (r_t − μ_r) / σ_r",
    desc: "How many standard deviations today's correlation deviates from its 2-year mean. |z| > 2 is the anomaly threshold — covers ~95% of normal behaviour.",
    tag: "anomaly detection",
  },
  {
    label: "Cosine Similarity",
    formula: "sim(A,B) = (A·B) / (‖A‖·‖B‖)",
    desc: "Applied to the full 28-dimensional Z-score vector. Finds historical periods where the same set of relationships were simultaneously anomalous.",
    tag: "analogue finder",
  },
];

function MathSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6 border-t border-border/50" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">
            The math, not the magic
          </p>
          <h2 className="text-3xl font-bold">No black boxes.</h2>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Three statistical ideas applied rigorously across 28 asset pairs and
            500 trading days.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MATH.map((m, i) => (
            <motion.div
              key={m.label}
              className="bg-card border border-border rounded-xl p-6 space-y-4
                hover:border-primary/20 transition-colors"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12 }}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">
                  {m.label}
                </p>
                <span
                  className="text-[10px] font-mono text-primary bg-primary/10
                  px-2 py-0.5 rounded-full border border-primary/20"
                >
                  {m.tag}
                </span>
              </div>
              <div
                className="bg-background/60 border border-border rounded-lg
                px-3 py-2.5 overflow-x-auto"
              >
                <p className="font-mono text-xs text-primary whitespace-nowrap">
                  {m.formula}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {m.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* nav */}
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b border-border/40
        bg-background/80 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded bg-primary/20 border border-primary/30
              flex items-center justify-center"
            >
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-sm">MacroLens</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/Tanish431/cross-asset-monitor"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <GitBranch className="w-3.5 h-3.5" />
                GitHub
              </a>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 px-4 text-xs font-semibold"
            >
              <Link href="/app" className="flex items-center gap-1.5">
                Open App <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-14">
        <CorrelationGrid />
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8 relative z-10"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-bold tracking-tight leading-[1.04]">
            Markets change <br className="hidden sm:block" />
            <span
              className="text-transparent bg-clip-text
              bg-gradient-to-br from-blue-400 via-primary to-orange-400"
            >
              their rules.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            MacroLens monitors cross-asset correlations and surfaces structural
            regime changes — the kind that precede major moves.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" asChild className="h-11 px-7 font-semibold">
              <Link href="/app" className="flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 px-7 border-border text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/Tanish431/cross-asset-monitor"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" /> Source
              </a>
            </Button>
          </div>

          <motion.div
            className="flex flex-col items-center gap-2 pt-6 opacity-30"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* how it works — vertical timeline */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl font-bold">
              From raw price to regime signal
            </h2>
          </motion.div>
          <div>
            {STEPS.map((step, i) => (
              <TimelineStep key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* bento */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">
              What you get
            </p>
            <h2 className="text-3xl font-bold">The full picture.</h2>
          </motion.div>
          <div className="grid grid-cols-12 gap-3 auto-rows-auto">
            {BENTO_ITEMS.map((item, i) => (
              <BentoCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* math */}
      <MathSection />

      {/* CTA */}
      <section className="py-28 px-6 border-t border-border/50">
        <motion.div
          className="max-w-xl mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold leading-tight">
            What regime are you in
            <br />
            right now?
          </h2>
          <p className="text-muted-foreground">
            Updated daily. No signup required.
          </p>
          <Button
            size="lg"
            asChild
            className="h-12 px-10 text-base font-semibold"
          >
            <Link href="/app" className="flex items-center gap-2">
              Find out <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold">MacroLens</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Not financial advice. Research use only.
          </p>
          <a
            href="https://github.com/Tanish431/cross-asset-monitor"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
