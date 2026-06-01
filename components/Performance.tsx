"use client";
import { League } from "@/lib/types";
import { COLORS, rygColor } from "@/lib/colors";

function Badge({ emblem, short, i }: { emblem: string | null; short: string; i: number }) {
  return emblem
    ? <img className="badge sm" src={`/${emblem}`} alt="" loading="lazy" />
    : <div className="badge sm" style={{ background: `linear-gradient(160deg,${COLORS[i % COLORS.length]},${COLORS[(i + 3) % COLORS.length]})` }}>{short}</div>;
}

export default function Performance({ d }: { d: League }) {
  const { events, rows } = d.performance;
  const all = rows.flatMap((r) => r.points);
  const min = Math.min(...all), max = Math.max(...all);
  const last5 = [...rows].sort((a, b) => b.last5 - a.last5);
  const last10 = [...rows].sort((a, b) => b.last10 - a.last10);

  return (
    <>
      <section className="block">
        <h2 className="h2">Performance por <span className="g">GW</span></h2>
        <p className="kicker">Puntos de cada equipo por jornada · color por rendimiento (rojo→verde) · ordenado por total</p>
        <div className="panel reveal"><div className="matrix"><table className="mx">
          <thead><tr>
            <th className="sticky">Equipo</th>
            {events.map((e) => <th key={e}>{e}</th>)}
            <th className="tot">Total</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="sticky"><div className="team"><Badge emblem={r.emblem} short={r.short} i={i} /><div className="nm">{r.name}</div></div></td>
                {r.points.map((p, j) => (
                  <td key={j}><span className="cell" style={{ background: rygColor(p, min, max) }}>{p}</span></td>
                ))}
                <td className="total"><span className="cell">{r.total}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
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
