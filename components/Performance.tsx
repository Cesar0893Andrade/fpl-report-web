"use client";
import { useState } from "react";
import { League, PerfRow } from "@/lib/types";
import { COLORS } from "@/lib/colors";

function Badge({ emblem, short, i }: { emblem: string | null; short: string; i: number }) {
  return emblem
    ? <img className="badge sm" src={`/${emblem}`} alt="" loading="lazy" />
    : <div className="badge sm" style={{ background: `linear-gradient(160deg,${COLORS[i % COLORS.length]},${COLORS[(i + 3) % COLORS.length]})` }}>{short}</div>;
}

// color por resultado H2H de la jornada
function resColor(res: string) {
  return res === "W" ? "#63BE7B" : res === "D" ? "#FFEB84" : res === "L" ? "#F8696B" : "rgba(255,255,255,.08)";
}

type Mode = "rank" | "pts";

export default function Performance({ d }: { d: League }) {
  const [mode, setMode] = useState<Mode>("rank");
  const { events, rows } = d.performance;

  const sorted: PerfRow[] = mode === "rank"
    ? [...rows].sort((a, b) => a.avg_rank - b.avg_rank)
    : [...rows].sort((a, b) => b.total - a.total);
  const cellVal = (r: PerfRow, j: number) => (mode === "rank" ? r.ranks[j] : r.points[j]);

  const windows = [
    { t: "Últimas 5", pts: (r: PerfRow) => r.last5, rank: (r: PerfRow) => r.last5_rank },
    { t: "Últimas 10", pts: (r: PerfRow) => r.last10, rank: (r: PerfRow) => r.last10_rank },
  ];

  return (
    <>
      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Performance por <span className="g">GW</span></h2>
            <p className="kicker">
              {mode === "rank"
                ? "Posición dentro de cada jornada (1 = mejor de la fecha) · empates comparten · neutraliza dobles jornadas"
                : "Puntos de cada equipo por jornada · ordenado por total"}
            </p>
          </div>
          <div className="seg">
            <button className={mode === "rank" ? "on" : ""} onClick={() => setMode("rank")}>Rank GW</button>
            <button className={mode === "pts" ? "on" : ""} onClick={() => setMode("pts")}>Puntos</button>
          </div>
        </div>
        <div className="legendchips">
          <span>Color = resultado H2H:</span>
          <em className="ck" style={{ background: "#63BE7B" }}>Ganó</em>
          <em className="ck" style={{ background: "#FFEB84" }}>Empató</em>
          <em className="ck" style={{ background: "#F8696B" }}>Perdió</em>
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
                  <td key={j}><span className="cell" style={{ background: resColor(r.results[j]) }}>{cellVal(r, j)}</span></td>
                ))}
                <td className="total"><span className="cell">{mode === "rank" ? r.avg_rank.toFixed(1) : r.total}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
        <p className="legendnote">El número es {mode === "rank" ? "la posición de esa jornada (menor = mejor); «Prom» = posición promedio" : "el puntaje de esa jornada"}. El color refleja si esa semana ganaste, empataste o perdiste tu enfrentamiento.</p>
      </section>

      <section className="block">
        <h2 className="h2"><span className="g">Form</span> · ¿quién está caliente?</h2>
        <p className="kicker">{mode === "rank" ? "Por posición promedio en las últimas jornadas (menor = mejor)" : "Por puntos sumados en las últimas jornadas"}</p>
        <div className="formgrid">
          {windows.map((w) => {
            const arr = mode === "rank"
              ? [...rows].sort((a, b) => w.rank(a) - w.rank(b))
              : [...rows].sort((a, b) => w.pts(b) - w.pts(a));
            return (
              <div className="panel formcard reveal" key={w.t}>
                <div className="formhead">{w.t}</div>
                {arr.map((r, i) => {
                  const prim = mode === "rank" ? w.rank(r).toFixed(1) : String(w.pts(r));
                  const primU = mode === "rank" ? "pos" : "pts";
                  const sec = mode === "rank" ? `${w.pts(r)} pts` : `${w.rank(r).toFixed(1)} pos`;
                  return (
                    <div className="formrow" key={r.id}>
                      <span className="fr">{i + 1}</span>
                      <Badge emblem={r.emblem} short={r.short} i={i} />
                      <span className="fn">{r.name}</span>
                      <span className="fp">{prim}<small> {primU}</small></span>
                      <span className="fsec">{sec}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
