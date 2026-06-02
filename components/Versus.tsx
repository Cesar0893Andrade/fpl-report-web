"use client";
import { useState } from "react";
import { League, VersusRec } from "@/lib/types";
import Badge from "@/components/Badge";

function vColor(w: number, l: number, scale: number) {
  const net = w - l;
  if (net === 0) return "rgba(255,235,132,.5)";
  const t = Math.min(1, Math.abs(net) / scale);
  return net > 0 ? `rgba(99,190,123,${(0.3 + 0.6 * t).toFixed(2)})` : `rgba(248,105,107,${(0.3 + 0.6 * t).toFixed(2)})`;
}
type Mode = "real" | "sim";

export default function Versus({ d }: { d: League }) {
  const [mode, setMode] = useState<Mode>("real");
  const { ids, rec } = d.versus;
  const E = d.performance.events.length;

  const info: Record<number, { name: string; short: string; emblem: string | null; idx: number }> = {};
  d.standings.forEach((s) => { info[s.id] = { name: s.name, short: s.short, emblem: s.emblem, idx: 0 }; });
  ids.forEach((id, i) => { if (info[id]) info[id].idx = i; });
  const pts: Record<number, number[]> = {};
  d.performance.rows.forEach((r) => { pts[r.id] = r.points; });

  // simulación: H2H virtual comparando el score de cada par en las 38 GW
  const sim: Record<number, Record<number, VersusRec>> = {};
  ids.forEach((a) => { sim[a] = {}; });
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    let w = 0, l = 0, dd = 0; const pa = pts[a] || [], pb = pts[b] || [];
    for (let g = 0; g < E; g++) { if (pa[g] > pb[g]) w++; else if (pa[g] < pb[g]) l++; else dd++; }
    sim[a][b] = { w, d: dd, l };
  }
  const getRec = (a: number, b: number): VersusRec | undefined => (mode === "real" ? rec[a]?.[b] : sim[a]?.[b]);
  const scale = mode === "real" ? 4 : 14;

  // rivalidades (sobre el simulado = robusto), líder a la izquierda, con el real al lado
  type Pair = { A: number; B: number; sW: number; sL: number; rW: number; rL: number; rD: number; absSim: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j], s = sim[a][b], r = rec[a]?.[b]; if (!s || !r) continue;
    let A = a, B = b, sW = s.w, sL = s.l, rW = r.w, rL = r.l;
    if (s.l > s.w) { A = b; B = a; sW = s.l; sL = s.w; rW = r.l; rL = r.w; }
    pairs.push({ A, B, sW, sL, rW, rL, rD: r.d, absSim: Math.abs(s.w - s.l) });
  }
  const even = [...pairs].sort((x, y) => x.absSim - y.absSim).slice(0, 5);
  const hege = [...pairs].sort((x, y) => y.absSim - x.absSim).slice(0, 5);

  // suerte de calendario: victorias H2H reales − esperadas (según fuerza de scoring)
  const luck = ids.map((a) => {
    let exp = 0, act = 0;
    for (const b of ids) {
      if (a === b) continue; const r = rec[a]?.[b]; if (!r) continue;
      const g = r.w + r.d + r.l; if (!g) continue;
      const s = sim[a][b]; const simPct = (s.w + 0.5 * s.d) / E;
      exp += simPct * g; act += r.w + 0.5 * r.d;
    }
    return { id: a, luck: act - exp };
  }).sort((x, y) => y.luck - x.luck);
  const maxLuck = Math.max(1, ...luck.map((x) => Math.abs(x.luck)));

  const Rivalry = ({ p }: { p: Pair }) => (
    <div className="rivrow">
      <span className="side"><Badge emblem={info[p.A]?.emblem} short={info[p.A]?.short} i={info[p.A]?.idx} /><span className="rivn">{info[p.A]?.name}</span></span>
      <span className="rivsc" title={`Simulado 38 GW: ${p.sW}-${p.sL} · Real: ${p.rW}-${p.rL}${p.rD ? " +" + p.rD + "E" : ""}`}>{p.sW}<i>–</i>{p.sL}<small> sim · {p.rW}-{p.rL} real</small></span>
      <span className="side r"><span className="rivn">{info[p.B]?.name}</span><Badge emblem={info[p.B]?.emblem} short={info[p.B]?.short} i={info[p.B]?.idx} /></span>
    </div>
  );

  return (
    <>
      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Cara a <span className="g">cara</span></h2>
            <p className="kicker">
              {mode === "real"
                ? "Registro H2H real entre cada par (victorias–derrotas de la fila) · solo las fechas que les tocó jugar"
                : "Si se compararan las 38 jornadas: cuántas habría ganado cada uno (victorias–derrotas de la fila) · sin el ruido del calendario"}
              {" · 🟢 domina la fila · 🔴 domina la columna · 🟡 parejo"}
            </p>
          </div>
          <div className="seg">
            <button className={mode === "real" ? "on" : ""} onClick={() => setMode("real")}>Real</button>
            <button className={mode === "sim" ? "on" : ""} onClick={() => setMode("sim")}>Simulado 38 GW</button>
          </div>
        </div>
        <div className="panel reveal"><div className="matrix"><table className="mx">
          <thead><tr>
            <th className="sticky">Equipo</th>
            {ids.map((id) => <th key={id} title={info[id]?.name}>{info[id]?.short}</th>)}
          </tr></thead>
          <tbody>
            {ids.map((a, i) => (
              <tr key={a}>
                <td className="sticky"><div className="team"><Badge emblem={info[a]?.emblem} short={info[a]?.short} i={i} /><div className="nm">{info[a]?.name}</div></div></td>
                {ids.map((b) => {
                  if (a === b) return <td key={b}><span className="cell" style={{ background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.18)" }}>—</span></td>;
                  const r = getRec(a, b);
                  return <td key={b}><span className="cell" style={{ background: r ? vColor(r.w, r.l, scale) : "transparent" }} title={r ? `${r.w}V ${r.d}E ${r.l}D` : ""}>{r ? `${r.w}-${r.l}` : ""}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table></div></div>
        <p className="legendnote">«Simulado 38 GW» compara el puntaje de cada par en todas las jornadas (no solo cuando se enfrentaron) → mide la hegemonía real sin el sesgo de una muestra de pocos partidos.</p>
      </section>

      <section className="block">
        <h2 className="h2"><span className="g">Rivalidades</span> <small style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>(según las 38 GW)</small></h2>
        <p className="kicker">Las más cerradas y las más dominadas, midiendo las 38 jornadas (con el resultado real al lado)</p>
        <div className="rivgrid">
          <div className="panel rivcard reveal"><div className="formhead">⚖️ Más parejos</div>{even.map((p) => <Rivalry key={`${p.A}-${p.B}`} p={p} />)}</div>
          <div className="panel rivcard reveal"><div className="formhead">👑 Más hegemónicos</div>{hege.map((p) => <Rivalry key={`${p.A}-${p.B}`} p={p} />)}</div>
        </div>
      </section>

      <section className="block">
        <h2 className="h2">Suerte de <span className="g">calendario</span></h2>
        <p className="kicker">Victorias H2H reales menos las esperadas por fuerza de scoring. Positivo = el calendario te favoreció (ganaste a quien debías y en buen momento); negativo = te tocó duro.</p>
        <div className="panel reveal" style={{ padding: "8px 18px" }}>
          {luck.map((x) => (
            <div className="luckrow" key={x.id}>
              <span className="side"><Badge emblem={info[x.id]?.emblem} short={info[x.id]?.short} i={info[x.id]?.idx} /><span className="rivn">{info[x.id]?.name}</span></span>
              <div className="luckbar">
                <span className="lb" style={{ width: `${50 * Math.abs(x.luck) / maxLuck}%`, marginLeft: x.luck >= 0 ? "50%" : `${50 - 50 * Math.abs(x.luck) / maxLuck}%`, background: x.luck >= 0 ? "var(--scale-green)" : "var(--scale-red)" }} />
                <span className="lzero" />
              </div>
              <span className="luckval" style={{ color: x.luck >= 0 ? "var(--mint)" : "#FF7DA6" }}>{x.luck >= 0 ? "+" : ""}{x.luck.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
