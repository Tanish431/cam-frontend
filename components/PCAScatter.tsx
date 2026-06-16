"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface PCAPoint {
  time: string;
  pc1: number;
  pc2: number;
  cluster_id: number;
}

interface ClusterProfile {
  cluster_id: number;
  label: string;
}

interface PCAVariance {
  pc1_variance: number;
  pc2_variance: number;
}

interface PCAData {
  points: PCAPoint[];
  variance: PCAVariance;
  profiles: ClusterProfile[];
}

const CLUSTER_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444"];

export default function PCAScatter({ window }: { window: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<PCAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<PCAPoint | null>(null);
  const [analogueDates, setAnalogueDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:8080/api/pca?window=${window}`).then((r) =>
        r.json(),
      ),
      fetch(`http://localhost:8080/api/analogues?window=${window}`).then((r) =>
        r.json(),
      ),
    ])
      .then(([pca, analogues]) => {
        if (pca?.points) setData(pca);
        if (Array.isArray(analogues)) {
          setAnalogueDates(new Set(analogues.map((a: any) => a.date)));
        }
      })
      .finally(() => setLoading(false));
  }, [window]);

  useEffect(() => {
    if (!data || !svgRef.current || !data.points.length) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 640;
    const height = svgRef.current.clientHeight || 420;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xExt = d3.extent(data.points, (d) => d.pc1) as [number, number];
    const yExt = d3.extent(data.points, (d) => d.pc2) as [number, number];

    // add 10% padding
    const xPad = (xExt[1] - xExt[0]) * 0.1;
    const yPad = (yExt[1] - yExt[0]) * 0.1;

    const xScale = d3
      .scaleLinear()
      .domain([xExt[0] - xPad, xExt[1] + xPad])
      .range([0, innerW]);

    const yScale = d3
      .scaleLinear()
      .domain([yExt[0] - yPad, yExt[1] + yPad])
      .range([innerH, 0]);

    // grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-innerH)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#f1f5f9")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#f1f5f9")
      .attr("stroke-width", 1);

    // zero axes
    g.append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", "#cbd5e1")
      .attr("stroke-dasharray", "4 2");

    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-dasharray", "4 2");

    // axes labels
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 32)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#94a3b8")
      .text(`PC1 (${(data.variance.pc1_variance * 100).toFixed(1)}% variance)`);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -28)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#94a3b8")
      .text(`PC2 (${(data.variance.pc2_variance * 100).toFixed(1)}% variance)`);

    // draw trajectory line (faint, connecting dots in time order)
    const line = d3
      .line<PCAPoint>()
      .x((d) => xScale(d.pc1))
      .y((d) => yScale(d.pc2))
      .curve(d3.curveCatmullRom);

    g.append("path")
      .datum(data.points)
      .attr("fill", "none")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 0.8)
      .attr("d", line);
    // draw recent trajectory with arrow (last 20 days)
    const recentPoints = data.points.slice(-20);
    if (recentPoints.length >= 2) {
      // thicker recent path
      g.append("path")
        .datum(recentPoints)
        .attr("fill", "none")
        .attr("stroke", "#475569")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "none")
        .attr("opacity", 0.5)
        .attr("d", line);

      // arrowhead at today
      const last = recentPoints[recentPoints.length - 1];
      const second = recentPoints[recentPoints.length - 2];
      const angle =
        (Math.atan2(
          yScale(last.pc2) - yScale(second.pc2),
          xScale(last.pc1) - xScale(second.pc1),
        ) *
          180) /
        Math.PI;

      g.append("polygon")
        .attr("points", "-6,-3 0,0 -6,3")
        .attr("fill", "#475569")
        .attr("opacity", 0.7)
        .attr(
          "transform",
          `translate(${xScale(last.pc1)},${yScale(last.pc2)}) rotate(${angle})`,
        );
    }
    // color scale by time for gradient effect within clusters
    const timeScale = d3
      .scaleSequential()
      .domain([0, data.points.length])
      .interpolator(d3.interpolateViridis);

    // draw all points
    const today = data.points[data.points.length - 1];

    g.selectAll("circle.point")
      .data(data.points.slice(0, -1)) // all except today
      .join("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.pc1))
      .attr("cy", (d) => yScale(d.pc2))
      .attr("r", (d) => (analogueDates.has(d.time) ? 5 : 3))
      .attr("fill", (d, i) => CLUSTER_COLORS[d.cluster_id % 4])
      .attr("fill-opacity", (_, i) => 0.3 + (i / data.points.length) * 0.5)
      .attr("stroke", (d) => (analogueDates.has(d.time) ? "#1e40af" : "none"))
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 6).attr("fill-opacity", 1);
        setHovered(d);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .attr("r", analogueDates.has(d.time) ? 5 : 3)
          .attr("fill-opacity", 0.6);
        setHovered(null);
      });

    // analogue labels
    data.points
      .filter((p) => analogueDates.has(p.time))
      .forEach((p) => {
        g.append("text")
          .attr("x", xScale(p.pc1) + 6)
          .attr("y", yScale(p.pc2) - 4)
          .attr("font-size", 9)
          .attr("fill", "#1e40af")
          .attr("font-weight", "600")
          .text(p.time.slice(5)); // MM-DD
      });

    // today — large star
    g.append("circle")
      .attr("cx", xScale(today.pc1))
      .attr("cy", yScale(today.pc2))
      .attr("r", 10)
      .attr("fill", CLUSTER_COLORS[today.cluster_id % 4])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5)
      .attr("fill-opacity", 1);

    g.append("text")
      .attr("x", xScale(today.pc1) + 13)
      .attr("y", yScale(today.pc2) + 4)
      .attr("font-size", 10)
      .attr("font-weight", "700")
      .attr("fill", "#1e293b")
      .text("TODAY");

    // axis ticks
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(3))
      .selectAll("text")
      .attr("font-size", 9)
      .attr("fill", "#94a3b8");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(3))
      .selectAll("text")
      .attr("font-size", 9)
      .attr("fill", "#94a3b8");
  }, [data, analogueDates]);

  if (loading)
    return <div className="text-gray-400 text-sm">Running PCA...</div>;
  if (!data?.points?.length)
    return (
      <div className="text-gray-400 text-sm">
        No PCA data yet — run the PCA service first.
      </div>
    );

  const today = data.points[data.points.length - 1];
  const todayLabel =
    data.profiles.find((p) => p.cluster_id === today?.cluster_id)?.label ?? "—";

  return (
    <div className="space-y-3">
      {/* header stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: CLUSTER_COLORS[today?.cluster_id % 4] }}
            />
            <span className="text-sm font-semibold text-gray-700">
              Today: {todayLabel}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {(data.variance.pc1_variance * 100).toFixed(1)}% +{" "}
            {(data.variance.pc2_variance * 100).toFixed(1)}% ={" "}
            {(
              (data.variance.pc1_variance + data.variance.pc2_variance) *
              100
            ).toFixed(1)}
            % variance explained
          </span>
        </div>

        {/* legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {data.profiles.map((p) => (
            <div key={p.cluster_id} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: CLUSTER_COLORS[p.cluster_id % 4] }}
              />
              <span className="text-xs text-gray-500">{p.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-blue-700 bg-white" />
            <span className="text-xs text-gray-500">Analogue</span>
          </div>
        </div>
      </div>

      {/* hovered point info */}
      <div className="h-5">
        {hovered && (
          <p
            className="text-xs font-mono text-gray-600 bg-gray-50
            px-2 py-1 rounded inline-block"
          >
            {hovered.time} ·{" "}
            {
              data.profiles.find((p) => p.cluster_id === hovered.cluster_id)
                ?.label
            }
            · PC1={hovered.pc1.toFixed(3)} PC2={hovered.pc2.toFixed(3)}
          </p>
        )}
      </div>

      {/* scatter plot */}
      <svg
        ref={svgRef}
        className="w-full rounded-lg bg-white border border-gray-100"
        style={{ height: 420 }}
      />

      <p className="text-xs text-gray-400">
        Each point = one trading day projected onto the two principal components
        of the correlation Z-score matrix. Color = regime cluster. Faint line =
        market trajectory through time.{" "}
        <span className="text-blue-600 font-medium">
          Blue ring = analogue date.
        </span>{" "}
        Opacity increases toward present. Hover any point for details.
      </p>
    </div>
  );
}
