"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface CorrelationEntry {
  symbol_a: string;
  symbol_b: string;
  correlation: number;
  zscore: number;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  assetClass: string;
}

interface Link {
  source: string | Node;
  target: string | Node;
  correlation: number;
  zscore: number;
}

const CLASS_COLORS: Record<string, string> = {
  equity: "#3b82f6",
  commodity: "#f59e0b",
  crypto: "#8b5cf6",
  macro: "#ef4444",
};

const CLASS_LABELS: Record<string, string> = {
  equity: "Equity",
  commodity: "Commodity",
  crypto: "Crypto",
  macro: "Macro",
};

function edgeColor(correlation: number): string {
  if (correlation > 0) return "#22c55e";
  return "#ef4444";
}

function edgeWidth(correlation: number): number {
  return Math.abs(correlation) * 6;
}

function edgeOpacity(correlation: number, zscore: number): number {
  const base = Math.abs(correlation) * 0.8;
  return Math.abs(zscore) > 2 ? Math.min(base + 0.2, 1.0) : base * 0.7;
}

export default function NetworkGraph({ window }: { window: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.3);
  const [hoveredPair, setHoveredPair] = useState<string | null>(null);
  const [centralityScores, setCentralityScores] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8080/api/assets").then((r) => r.json()),
      fetch(`http://localhost:8080/api/correlations?window=${window}`).then(
        (r) => r.json(),
      ),
    ]).then(([a, c]) => {
      setAssets(a);
      setCorrelations(c);
      setLoading(false);
    });
  }, [window]);

  useEffect(() => {
    if (loading || !svgRef.current || !assets.length || !correlations.length)
      return;

    // compute degree centrality for each node
    // weighted by absolute correlation strength
    const centrality: Record<string, number> = {};
    assets.forEach((a) => {
      centrality[a.symbol] = 0;
    });
    correlations.forEach((c) => {
      if (Math.abs(c.correlation) >= threshold) {
        centrality[c.symbol_a] =
          (centrality[c.symbol_a] ?? 0) + Math.abs(c.correlation);
        centrality[c.symbol_b] =
          (centrality[c.symbol_b] ?? 0) + Math.abs(c.correlation);
      }
    });

    // normalize centrality to 0-1
    const maxCentrality = Math.max(...Object.values(centrality), 1);
    const normCentrality: Record<string, number> = {};
    Object.entries(centrality).forEach(([k, v]) => {
      normCentrality[k] = v / maxCentrality;
    });

    setCentralityScores(normCentrality);

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 420;

    svg.selectAll("*").remove();

    const nodes: Node[] = assets.map((a) => ({
      id: a.symbol,
      assetClass: a.asset_class,
    }));

    const links: Link[] = correlations
      .filter((c) => Math.abs(c.correlation) >= threshold)
      .map((c) => ({
        source: c.symbol_a,
        target: c.symbol_b,
        correlation: c.correlation,
        zscore: c.zscore,
      }));

    // force simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance((d) => 180 - Math.abs(d.correlation) * 100)
          .strength((d) => Math.abs(d.correlation) * 0.4),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(40));

    // draw anomaly glow ring for nodes with any |z|>2 edges
    const anomalousNodes = new Set<string>();
    correlations.forEach((c) => {
      if (Math.abs(c.zscore) > 2) {
        anomalousNodes.add(c.symbol_a);
        anomalousNodes.add(c.symbol_b);
      }
    });
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => edgeColor(d.correlation))
      .attr("stroke-width", (d) => edgeWidth(d.correlation))
      .attr("stroke-opacity", (d) => edgeOpacity(d.correlation, d.zscore))
      .attr("stroke-dasharray", (d) => (Math.abs(d.zscore) > 2 ? "6 3" : null))
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        const sa =
          typeof d.source === "object" ? (d.source as Node).id : d.source;
        const sb =
          typeof d.target === "object" ? (d.target as Node).id : d.target;
        setHoveredPair(
          `${sa} - ${sb}: ${d.correlation.toFixed(3)} (z=${d.zscore.toFixed(2)})`,
        );
        d3.select(this)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", edgeWidth(d.correlation) + 2);
      })
      .on("mouseleave", function (event, d) {
        setHoveredPair(null);
        d3.select(this)
          .attr("stroke-opacity", edgeOpacity(d.correlation, d.zscore))
          .attr("stroke-width", edgeWidth(d.correlation));
      });

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      );

    // anomaly glow
    node
      .filter((d) => anomalousNodes.has(d.id))
      .append("circle")
      .attr("r", 24)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "4 2");

    // node circle
    node
      .append("circle")
      .attr("r", (d) => 14 + normCentrality[d.id] * 16)
      .attr("fill", (d) => CLASS_COLORS[d.assetClass] ?? "#6b7280")
      .attr("stroke", "#1a1917")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.85);

    // node label
    node
      .append("text")
      .text((d) => d.id.replace("^", "").replace("-USD", "").slice(0, 6))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("font-weight", "700")
      .attr("font-family", "monospace")
      .attr("fill", "#fff")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [assets, correlations, threshold, loading]);

  return (
    <div className="space-y-3">
      {/* controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">
            Min |correlation|
          </label>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <span className="text-xs font-mono text-foreground">
            {threshold.toFixed(2)}
          </span>
        </div>

        {/* legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {Object.entries(CLASS_LABELS).map(([cls, label]) => (
            <div key={cls} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: CLASS_COLORS[cls] }}
              />
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <div className="w-4 border-t-2 border-green-400" />
            <span>positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 border-t-2 border-red-400" />
            <span>negative</span>
          </div>
        </div>
      </div>

      {/* hovered pair info */}
      <div className="h-5">
        {hoveredPair && (
          <p
            className="text-xs font-mono text-foreground bg-muted/50
              border border-border px-2 py-1 rounded inline-block"
          >
            {hoveredPair}
          </p>
        )}
      </div>

      {/* graph */}
      {loading ? (
        <div
          className="flex items-center justify-center h-96
            text-muted-foreground text-sm"
        >
          Loading network...
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="w-full rounded-lg bg-background/40 border border-border/50"
          style={{ height: 420 }}
        />
      )}

      {/* centrality stats panel */}
      {Object.keys(centralityScores).length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p
            className="text-xs font-semibold text-muted-foreground
              uppercase tracking-wide mb-2"
          >
            Degree Centrality
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(centralityScores)
              .sort((a, b) => b[1] - a[1])
              .map(([symbol, score]) => (
                <div key={symbol} className="flex items-center gap-2">
                  <div
                    className="rounded-full shrink-0"
                    style={{
                      width: `${8 + score * 12}px`,
                      height: `${8 + score * 12}px`,
                      background:
                        CLASS_COLORS[
                          assets.find((a) => a.symbol === symbol)
                            ?.asset_class ?? ""
                        ] ?? "#6b7280",
                      opacity: 0.8,
                    }}
                  />
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Dashed edges = anomalous (|z| &gt; 2σ). Red ring = asset involved in
        anomaly. Drag nodes to explore. Adjust threshold to show stronger
        correlations only.
      </p>
    </div>
  );
}
