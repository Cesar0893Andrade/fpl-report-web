"use client";
import { useState } from "react";
import { PerfRow } from "@/lib/types";
import Badge from "@/components/Badge";

const FILTERS = [
  { k: "all", t: "Total", hue: "4,245,255" },
  { k: "W", t: "Ganó", hue: "99,190,123" },
  { k: "D", t: "Empató", hue: "255,235,132" },
  { k: "L", t: "Perdió", hue: "248,105,107" },
] as const;
type FK = (typeof FILTERS)[number]["k"];

export default function PositionDist({ rows }: { rows: PerfRow[] }) {
  const [f, setF] = useState<FK>("all");
  const N = rows.length;
  const filt = FILTERS.find((x) => x.k === f)!;
  const positions = Array.from({ length: N }, (_, i) => i + 1);

  const count = (r: PerfRow, p: number) =>
    r.ranks.reduce((acc, rk, idx) => acc + (rk === p && (f === "all" || r.results[idx] === f) ? 1 : 0), 0);

  const sorted = [...rows].sort((a, b) => a.avg_rank - b.avg_rank);
  let maxC = 1;
  for (const r of rows) for (const p of positions) maxC = Math.max(maxC, count(r, p));
  const bg = (c: number) => (c === 0 ? "transparent" : `rgba(${filt.hue},${(0.5 + 0.5 * c / maxC).toFixed(2)})`);

  return (
    <section className="block">
      <div className="secthead">
        <div>
          <h2 className="h2">Distribución de <span className="g">posiciones</span></h2>
          <p className="kicker">
            Cuántas veces cada equipo terminó en cada posición de jornada
            {f !== "all" ? ` · solo jornadas donde ${filt.t.toLowerCase()} el H2H` : " · todas las jornadas"}
          </p>
        </div>
        <div className="seg">
          {FILTERS.map((x) => (
            <button key={x.k} className={x.k === f ? "on" : ""} onClick={() => setF(x.k)}>{x.t}</button>
          ))}
        </div>
      </div>
      <div className="panel reveal"><div className="matrix"><table className="mx">
        <thead><tr>
          <th className="sticky">Equipo</th>
          {positions.map((p) => <th key={p}>{p}º</th>)}
          <th className="tot">Tot</th>
        </tr></thead>
        <tbody>
          {sorted.map((r, i) => {
            const cs = positions.map((p) => count(r, p));
            const tot = cs.reduce((a, b) => a + b, 0);
            return (
              <tr key={r.id}>
                <td className="sticky"><div className="team"><Badge emblem={r.emblem} short={r.short} i={i} /><div className="nm">{r.name}</div></div></td>
                {cs.map((c, j) => (
                  <td key={j}><span className="cell" style={{ background: bg(c), color: c ? "#15001a" : "rgba(255,255,255,.18)" }}>{c || ""}</span></td>
                ))}
                <td className="total"><span className="cell">{tot}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
      <p className="legendnote">Más intenso = más veces. «Tot» = total de jornadas en esa categoría (en «Ganó/Empató/Perdió» suma tus victorias/empates/derrotas).</p>
    </section>
  );
}
