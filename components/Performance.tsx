"use client";
import { useState } from "react";
import { League, PerfRow } from "@/lib/types";
import { COLORS, rygColor } from "@/lib/colors";

function Badge({ emblem, short, i }: { emblem: string | null; short: string; i: number }) {
  return emblem
    ? <img className="badge sm" src={`/${emblem}`} alt="" loading="lazy" />
    : <div className="badge sm" style={{ background: `linear-gradient(160deg,${COLORS[i % COLORS.length]},${COLORS[(i + 3) % COLORS.length]})` }}>{short}</div>;
}

type Mode = "rank" | "pts";

export default function Performance({ d }: { d: League }) {
  const [mode, setMode] = useState<Mode>("rank");
  const { events, rows } = d.performance;
  const N = rows.length;
  const allPts = rows.flatMap((r) => r.points);
  const pmin = Math.min(...allPts), pmax = Math.max(...allPts);

  const sorted: PerfRow[] = mode === "rank"
    ? [...rows].sort((a, b) => a.avg_rank - b.avg_rank)
    : [...rows].sort((a, b) => b.total - a.total);
  const cellVal = (r: PerfRow, j: number) => (mode === "rank" ? r.ranks[j] : r.points[j]);
  const cellColor = (r: PerfRow, j: number) =>
    mode === "rank" ? rygColor(N - r.ranks[j], 0, N - 1) : rygColor(r.points[j], pmin, pmax);

  const last5 = [...rows].sort((a, b) => b.last5 - a.last5);
  const last10 = [...rows].sort((a, b) => b.last10 - a.last10);

  return (
    <>
      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Performance por <span className="g">GW</span></h2>
            <p className="kicker">
              {mode === "rank"
                ? "Posición dentro de cada jornada (1 = mejor de la fecha) · empates comparten · más objetivo que el puntaje bruto (neutraliza dobles jornadas)"
                : "Puntos de cada equipo por jornada · color por rendimiento · ordenado por total"}
            </p>
          </div>
          <div className="seg">
            <button className={mode === "rank" ? "on" : ""} onClick={() => setMode("rank")}>Rank GW</button>
            <button className={mode === "pts" ? "on" : ""} onClick={() => setMode("pts")}>Puntos</button>
          </div>
        </div>
        <div className="panel reveal"><div className="matrix"><table className="mx">
          <thead><tr>
            <th className="sticky">Equipo</th>
            {events.map((e) => <th key={e}>{e}</th>)}
            <th className="tot">{mode === "rank" ? "Prom" : "Total"}</th>
          </tr></thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id}>
                <td className="sticky"><div className="team"><Badge emblem={r.emblem} short={r.short} i={i} /><div className="nm">{r.name}</div></div></td>
                {events.map((_, j) => (
                  <td key={j}><span className="cell" style={{ background: cellColor(r, j) }}>{cellVal(r, j)}</span></td>
                ))}
                <td className="total"><span className="cell">{mode === "rank" ? r.avg_rank.toFixed(1) : r.total}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
        {mode === "rank" && (
          <p className="legendnote">«Prom» = posición promedio por jornada (menor = mejor). Quien es 1.º en más fechas es el más consistente, sin importar si fueron jornadas dobles.</p>
        )}
      </section>

      <section className="block">
        <h2 className="h2"><span className="g">Form</span> · ¿quién está caliente?</h2>
        <p className="kicker">Suma de puntos en las últimas jornadas</p>
        <div className="formgrid">
          {([{ t: "Últimas 5", arr: last5, k: "last5" as const }, { t: "Últimas 10", arr: last10, k: "last10" as const }]).map((card) => (
            <div className="panel formcard reveal" key={card.k}>
              <div className="formhead">{card.t}</div>
              {card.arr.map((r, i) => (
                <div className="formrow" key={r.id}>
                  <span className="fr">{i + 1}</span>
                  <Badge emblem={r.emblem} short={r.short} i={i} />
                  <span className="fn">{r.name}</span>
                  <span className="fp">{card.k === "last5" ? r.last5 : r.last10}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
