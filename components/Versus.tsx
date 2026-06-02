"use client";
import { League, VersusRec } from "@/lib/types";
import Badge from "@/components/Badge";

function vColor(w: number, l: number) {
  const net = w - l;
  if (net === 0) return "rgba(255,235,132,.5)";
  const t = Math.min(1, Math.abs(net) / 4);
  return net > 0 ? `rgba(99,190,123,${(0.3 + 0.6 * t).toFixed(2)})` : `rgba(248,105,107,${(0.3 + 0.6 * t).toFixed(2)})`;
}

export default function Versus({ d }: { d: League }) {
  const { ids, rec } = d.versus;
  const info: Record<number, { name: string; short: string; emblem: string | null; idx: number }> = {};
  d.standings.forEach((s) => { info[s.id] = { name: s.name, short: s.short, emblem: s.emblem, idx: 0 }; });
  ids.forEach((id, i) => { if (info[id]) info[id].idx = i; });
  const get = (a: number, b: number): VersusRec | undefined => rec[String(a)]?.[String(b)];

  // rivalidades (cada par una vez, orientadas con el líder a la izquierda)
  type Pair = { A: number; B: number; wA: number; wB: number; d: number; games: number; abs: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const r = get(ids[i], ids[j]); if (!r) continue;
    const games = r.w + r.d + r.l; if (!games) continue;
    let A = ids[i], B = ids[j], wA = r.w, wB = r.l;
    if (r.l > r.w) { A = ids[j]; B = ids[i]; wA = r.l; wB = r.w; }
    pairs.push({ A, B, wA, wB, d: r.d, games, abs: Math.abs(r.w - r.l) });
  }
  const even = [...pairs].sort((x, y) => x.abs - y.abs || y.d - x.d || y.games - x.games).slice(0, 5);
  const hege = [...pairs].sort((x, y) => y.abs - x.abs || y.games - x.games).slice(0, 5);

  const Rivalry = ({ p }: { p: Pair }) => (
    <div className="rivrow">
      <span className="side"><Badge emblem={info[p.A]?.emblem} short={info[p.A]?.short} i={info[p.A]?.idx} /><span className="rivn">{info[p.A]?.name}</span></span>
      <span className="rivsc" title={`${p.wA}-${p.d}-${p.wB} (${p.games} partidos)`}>{p.wA}<i>–</i>{p.wB}{p.d ? <small> +{p.d}E</small> : null}</span>
      <span className="side r"><span className="rivn">{info[p.B]?.name}</span><Badge emblem={info[p.B]?.emblem} short={info[p.B]?.short} i={info[p.B]?.idx} /></span>
    </div>
  );

  return (
    <>
      <section className="block">
        <h2 className="h2">Cara a <span className="g">cara</span></h2>
        <p className="kicker">Registro H2H acumulado entre cada par (desde la perspectiva de la fila: victorias–derrotas) · 🟢 domina la fila · 🔴 domina la columna · 🟡 parejo</p>
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
                  const r = get(a, b);
                  return <td key={b}><span className="cell" style={{ background: r ? vColor(r.w, r.l) : "transparent" }} title={r ? `${r.w}V ${r.d}E ${r.l}D` : ""}>{r ? `${r.w}-${r.l}` : ""}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table></div></div>
      </section>

      <section className="block">
        <h2 className="h2"><span className="g">Rivalidades</span></h2>
        <p className="kicker">Las parejas más cerradas y las más dominadas hacia un lado</p>
        <div className="rivgrid">
          <div className="panel rivcard reveal">
            <div className="formhead">⚖️ Más parejos</div>
            {even.map((p) => <Rivalry key={`${p.A}-${p.B}`} p={p} />)}
          </div>
          <div className="panel rivcard reveal">
            <div className="formhead">👑 Más hegemónicos</div>
            {hege.map((p) => <Rivalry key={`${p.A}-${p.B}`} p={p} />)}
          </div>
        </div>
        <p className="legendnote">«Más hegemónicos» = un equipo domina al otro (p.ej. 4–0); «más parejos» = repartido (2–2, 3–2) o con empates. La simulación «si jugaran todas las fechas» llegará después.</p>
      </section>
    </>
  );
}
