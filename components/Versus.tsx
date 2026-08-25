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
type SView = "global" | "llave";

export default function Versus({ d }: { d: League }) {
  const [mode, setMode] = useState<Mode>("real");
  const [sview, setSview] = useState<SView>("global");
  const { ids, rec } = d.versus;
  const E = d.performance.events.length;
  // Rivalidades y suerte de calendario necesitan que los cruces se repitan; antes de eso
  // son ruido con forma de analisis.
  const maduro = E >= 4;

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
  const active = (a: number, b: number) => (mode === "real" ? rec[a]?.[b] : sim[a]?.[b]);
  const other = (a: number, b: number) => (mode === "real" ? sim[a]?.[b] : rec[a]?.[b]);
  const scale = mode === "real" ? 4 : 14;
  const actLbl = mode === "real" ? "real" : "sim";
  const othLbl = mode === "real" ? "sim" : "real";

  // rivalidades — según el modo activo (líder a la izquierda), con el otro registro al lado
  type Pair = { A: number; B: number; aW: number; aL: number; oW: number; oL: number; abs: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j], ac = active(a, b), ot = other(a, b); if (!ac || !ot) continue;
    let A = a, B = b, aW = ac.w, aL = ac.l, oW = ot.w, oL = ot.l;
    if (ac.l > ac.w) { A = b; B = a; aW = ac.l; aL = ac.w; oW = ot.l; oL = ot.w; }
    pairs.push({ A, B, aW, aL, oW, oL, abs: Math.abs(ac.w - ac.l) });
  }
  const even = [...pairs].sort((x, y) => x.abs - y.abs).slice(0, 5);
  const hege = [...pairs].sort((x, y) => y.abs - x.abs).slice(0, 5);

  // suerte de calendario — global (real vs esperado por fuerza de scoring)
  const luck = ids.map((a) => {
    let exp = 0, act = 0;
    for (const b of ids) {
      if (a === b) continue; const r = rec[a]?.[b]; if (!r) continue;
      const g = r.w + r.d + r.l; if (!g) continue;
      const s = sim[a][b]; exp += ((s.w + 0.5 * s.d) / E) * g; act += r.w + 0.5 * r.d;
    }
    return { id: a, luck: act - exp };
  }).sort((x, y) => y.luck - x.luck);
  const maxLuck = Math.max(1, ...luck.map((x) => Math.abs(x.luck)));

  // suerte por llave — desviación real vs simulado en cada emparejamiento (favorecido a la izq.)
  type Llave = { A: number; B: number; rW: number; rL: number; sW: number; sL: number; dev: number };
  const llaves: Llave[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j], r = rec[a]?.[b]; if (!r) continue;
    const g = r.w + r.d + r.l; if (!g) continue; const s = sim[a][b];
    const dev = (r.w + 0.5 * r.d) / g - (s.w + 0.5 * s.d) / E;
    if (dev >= 0) llaves.push({ A: a, B: b, rW: r.w, rL: r.l, sW: s.w, sL: s.l, dev });
    else llaves.push({ A: b, B: a, rW: r.l, rL: r.w, sW: s.l, sL: s.w, dev: -dev });
  }
  llaves.sort((x, y) => y.dev - x.dev);
  const topLlaves = llaves.slice(0, 8);

  const RivRow = ({ A, B, mainW, mainL, secW, secL, sec }: { A: number; B: number; mainW: number; mainL: number; secW: number; secL: number; sec: string }) => (
    <div className="rivrow">
      <span className="side"><Badge emblem={info[A]?.emblem} short={info[A]?.short} i={info[A]?.idx} /><span className="rivn">{info[A]?.name}</span></span>
      <span className="rivsc" title={`${mainW}-${mainL}`}>{mainW}<i>–</i>{mainL}<small> {sec} · {secW}-{secL}</small></span>
      <span className="side r"><span className="rivn">{info[B]?.name}</span><Badge emblem={info[B]?.emblem} short={info[B]?.short} i={info[B]?.idx} /></span>
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
                : "Si se compararan las 38 jornadas: cuántas ganaría cada uno (victorias–derrotas de la fila) · sin el ruido del calendario"}
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
                  const r = active(a, b);
                  return <td key={b}><span className="cell" style={{ background: r ? vColor(r.w, r.l, scale) : "transparent" }} title={r ? `${r.w}V ${r.d}E ${r.l}D` : ""}>{r ? `${r.w}-${r.l}` : ""}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table></div></div>
      </section>

      {!maduro ? (
        <section className="block">
          <h2 className="h2"><span className="g">Rivalidades</span> y suerte de <span className="g">calendario</span></h2>
          <p className="kicker" style={{ maxWidth: 720 }}>
            Aún no. Con {E} {E === 1 ? "jornada jugada" : "jornadas jugadas"} cada pareja se ha
            cruzado una sola vez: no hay parejas «cerradas» ni «dominadas» que distinguir, y la
            suerte de calendario daría cero para todos por construcción, no porque el fixture haya
            sido justo. Estas dos lecturas aparecen cuando la liga tenga recorrido.
          </p>
        </section>
      ) : (
      <>
      <section className="block">
        <h2 className="h2"><span className="g">Rivalidades</span> <small style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>(según {mode === "real" ? "lo real" : "las 38 GW"})</small></h2>
        <p className="kicker">Las parejas más cerradas y las más dominadas, con el otro registro ({othLbl}) al lado · sigue el selector de arriba</p>
        <div className="rivgrid">
          <div className="panel rivcard reveal"><div className="formhead">⚖️ Más parejos</div>{even.map((p) => <RivRow key={`${p.A}-${p.B}`} A={p.A} B={p.B} mainW={p.aW} mainL={p.aL} secW={p.oW} secL={p.oL} sec={othLbl} />)}</div>
          <div className="panel rivcard reveal"><div className="formhead">👑 Más hegemónicos</div>{hege.map((p) => <RivRow key={`${p.A}-${p.B}`} A={p.A} B={p.B} mainW={p.aW} mainL={p.aL} secW={p.oW} secL={p.oL} sec={othLbl} />)}</div>
        </div>
      </section>

      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Suerte de <span className="g">calendario</span></h2>
            <p className="kicker">
              {sview === "global"
                ? "Por equipo: victorias H2H reales menos las esperadas por fuerza de scoring. + = el calendario te favoreció; − = te tocó duro."
                : "Por llave: en qué emparejamientos la suerte pesó más (real vs simulado de 38 GW). El de la izquierda salió favorecido en esa llave."}
            </p>
          </div>
          <div className="seg">
            <button className={sview === "global" ? "on" : ""} onClick={() => setSview("global")}>Global</button>
            <button className={sview === "llave" ? "on" : ""} onClick={() => setSview("llave")}>Por llave</button>
          </div>
        </div>
        {sview === "global" ? (
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
        ) : (
          <div className="panel reveal" style={{ padding: "6px 18px" }}>
            {topLlaves.map((p) => (
              <div className="rivrow" key={`${p.A}-${p.B}`}>
                <span className="side"><Badge emblem={info[p.A]?.emblem} short={info[p.A]?.short} i={info[p.A]?.idx} /><span className="rivn">{info[p.A]?.name}</span></span>
                <span className="rivsc" title={`Real ${p.rW}-${p.rL} · Simulado 38GW ${p.sW}-${p.sL}`}>{p.rW}<i>–</i>{p.rL}<small> real · sim {p.sW}-{p.sL}</small></span>
                <span className="side r"><span className="rivn">{info[p.B]?.name}</span><Badge emblem={info[p.B]?.emblem} short={info[p.B]?.short} i={info[p.B]?.idx} /></span>
                <span className="luckval" style={{ color: "var(--mint)" }}>+{Math.round(p.dev * 100)}%</span>
              </div>
            ))}
            <p className="legendnote">+% = cuánto más ganó el equipo de la izquierda en esa llave de lo que predecía la simulación de 38 GW (la suerte/timing de cuándo se enfrentaron).</p>
          </div>
        )}
      </section>
      </>
      )}
    </>
  );
}
