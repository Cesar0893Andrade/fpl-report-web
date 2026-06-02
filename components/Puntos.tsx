"use client";
import { useMemo, useState } from "react";
import { League, TeamPts, PtsAgg } from "@/lib/types";
import Badge from "@/components/Badge";
import { rygColor } from "@/lib/colors";

type View = "equipos" | "posicion" | "tipo" | "jugador";
type Lens = "squad" | "xi";
const POS = ["GKP", "DEF", "MID", "FWD"];
const POSC: Record<string, string> = { GKP: "#FFD166", DEF: "#04F5FF", MID: "#00FF87", FWD: "#FF2D78" };
const TLABEL: Record<string, string> = {
  min: "Minutos", gls: "Goles", ast: "Asist.", cs: "Portería 0", dc: "Contr. def.",
  sav: "Atajadas", gc: "Goles contra", bon: "Bonus", dis: "Disciplina",
};
// agrupación ataque / defensa / presencia / bonus / disciplina
const ROLL = [
  { k: "pres", t: "Presencia", keys: ["min"], c: "#9D8DF1" },
  { k: "att", t: "Ataque", keys: ["gls", "ast"], c: "#FF2D78" },
  { k: "def", t: "Defensa", keys: ["cs", "dc", "sav", "gc"], c: "#04F5FF" },
  { k: "bon", t: "Bonus", keys: ["bon"], c: "#FFD166" },
  { k: "dis", t: "Disciplina", keys: ["dis"], c: "#F8696B" },
];

export default function Puntos({ d }: { d: League }) {
  const [view, setView] = useState<View>("equipos");
  const [lens, setLens] = useState<Lens>("xi");
  const meta = useMemo(
    () => Object.fromEntries(d.standings.map((s, i) => [s.id, { name: s.name, short: s.short, emblem: s.emblem, i }])),
    [d.standings]
  );
  const teams = d.points.teams;
  const [team, setTeam] = useState(teams[0]?.id ?? 0);
  const A = (t: TeamPts): PtsAgg => t[lens];
  const showLens = view === "posicion" || view === "tipo";

  return (
    <>
      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Análisis de <span className="g">puntos</span></h2>
            <p className="kicker">
              Cuántos puntos sumó cada equipo, de dónde vienen y cuántos se quedaron en la banca.
              {showLens && (lens === "xi"
                ? " · Mostrando solo lo que CONTÓ (XI titular, con auto-sustituciones)"
                : " · Mostrando toda la PLANTILLA (los 15, incluida la banca)")}
            </p>
          </div>
          <div className="seg">
            <button className={view === "equipos" ? "on" : ""} onClick={() => setView("equipos")}>Equipos</button>
            <button className={view === "posicion" ? "on" : ""} onClick={() => setView("posicion")}>Posición</button>
            <button className={view === "tipo" ? "on" : ""} onClick={() => setView("tipo")}>Tipo</button>
            <button className={view === "jugador" ? "on" : ""} onClick={() => setView("jugador")}>Jugador</button>
          </div>
        </div>
        {showLens && (
          <div className="seg lensseg">
            <button className={lens === "xi" ? "on" : ""} onClick={() => setLens("xi")}>Titular (XI)</button>
            <button className={lens === "squad" ? "on" : ""} onClick={() => setLens("squad")}>Plantilla (15)</button>
          </div>
        )}
      </section>

      {view === "equipos" && <Equipos teams={teams} meta={meta} />}
      {view === "posicion" && <Posicion teams={teams} meta={meta} A={A} lens={lens} />}
      {view === "tipo" && <Tipo teams={teams} meta={meta} A={A} />}
      {view === "jugador" && <Jugador teams={teams} meta={meta} team={team} setTeam={setTeam} />}
    </>
  );
}

/* ===================== EQUIPOS: plantilla vs titular ===================== */
function Equipos({ teams, meta }: { teams: TeamPts[]; meta: any }) {
  const rows = [...teams].sort((a, b) => b.squad.total - a.squad.total);
  const maxSq = Math.max(1, ...rows.map((t) => t.squad.total));
  const bestUse = [...teams].sort((a, b) => b.xi.total / b.squad.total - a.xi.total / a.squad.total)[0];
  const mostWaste = [...teams].sort((a, b) => (b.squad.total - b.xi.total) - (a.squad.total - a.xi.total))[0];

  return (
    <section className="block" style={{ paddingTop: 4 }}>
      <div className="legendchips">
        <span>Por equipo:</span>
        <em className="ck" style={{ background: "var(--mint)", color: "#15001a" }}>Titular · contó</em>
        <em className="ck" style={{ background: "rgba(255,255,255,.16)" }}>Banca · desperdiciado</em>
      </div>
      <div className="panel reveal ptslist">
        {rows.map((t) => {
          const xi = t.xi.total, sq = t.squad.total, waste = sq - xi;
          const use = Math.round((xi / sq) * 100);
          return (
            <div className="ptsrow" key={t.id}>
              <span className="side"><Badge emblem={meta[t.id].emblem} short={meta[t.id].short} i={meta[t.id].i} /><span className="rivn">{meta[t.id].name}</span></span>
              <div className="ptsbar" title={`${xi} titular + ${waste} banca = ${sq}`}>
                <span className="seg-xi" style={{ width: `${(xi / maxSq) * 100}%` }}>{xi}</span>
                <span className="seg-bench" style={{ width: `${(waste / maxSq) * 100}%` }}>{waste > 0 ? `+${waste}` : ""}</span>
              </div>
              <span className="ptsuse">{use}%</span>
            </div>
          );
        })}
      </div>
      <p className="legendnote">
        La barra verde son los puntos que <b>realmente contaron</b> (tu XI, incluidas auto-sustituciones) y coincide con tus puntos a favor. La parte gris son puntos que sumaron tus jugadores <b>en la banca</b> y nunca entraron al marcador. «%» = aprovechamiento (titular ÷ plantilla).
        <br />Mejor aprovechamiento: <b style={{ color: "var(--mint)" }}>{meta[bestUse.id].name}</b> ({Math.round((bestUse.xi.total / bestUse.squad.total) * 100)}%) · Más desperdicio en banca: <b>{meta[mostWaste.id].name}</b> ({mostWaste.squad.total - mostWaste.xi.total} pts).
      </p>
    </section>
  );
}

/* ===================== POSICIÓN: matriz heatmap ===================== */
function Posicion({ teams, meta, A, lens }: { teams: TeamPts[]; meta: any; A: (t: TeamPts) => PtsAgg; lens: Lens }) {
  const rows = [...teams].sort((a, b) => A(b).total - A(a).total);
  const colMinMax = (key: string) => {
    const vals = teams.map((t) => A(t).pos[key]);
    return [Math.min(...vals), Math.max(...vals)] as const;
  };
  const totMM = [Math.min(...teams.map((t) => A(t).total)), Math.max(...teams.map((t) => A(t).total))] as const;
  return (
    <section className="block" style={{ paddingTop: 4 }}>
      <div className="panel reveal"><div className="matrix"><table className="mx">
        <thead><tr>
          <th className="sticky">Equipo</th>
          {POS.map((p) => <th key={p} style={{ color: POSC[p] }}>{p}</th>)}
          <th className="tot">Total</th>
        </tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="sticky"><div className="team"><Badge emblem={meta[t.id].emblem} short={meta[t.id].short} i={meta[t.id].i} /><div className="nm">{meta[t.id].name}</div></div></td>
              {POS.map((p) => {
                const v = A(t).pos[p]; const [mn, mx] = colMinMax(p);
                return <td key={p}><span className="cell" style={{ background: rygColor(v, mn, mx), color: "#15001a" }}>{v}</span></td>;
              })}
              <td className="total"><span className="cell" style={{ background: rygColor(A(t).total, totMM[0], totMM[1]), color: "#15001a", fontWeight: 800 }}>{A(t).total}</span></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      <p className="legendnote">Puntos {lens === "xi" ? "del XI titular" : "de toda la plantilla"} por posición. Color por columna: verde = más puntos en ese puesto respecto al resto de la liga, rojo = menos.</p>
    </section>
  );
}

/* ===================== TIPO: orientación cliqueable + positivos/negativos ===================== */
type Sign = "net" | "pos" | "neg";
function Tipo({ teams, meta, A }: { teams: TeamPts[]; meta: any; A: (t: TeamPts) => PtsAgg }) {
  const [sel, setSel] = useState<Set<string>>(() => new Set(ROLL.map((r) => r.k)));
  const [sign, setSign] = useState<Sign>("net");
  const toggle = (k: string) =>
    setSel((prev) => { const n = new Set(prev); if (n.has(k)) { if (n.size > 1) n.delete(k); } else n.add(k); return n; });
  const allOn = sel.size === ROLL.length;

  const selRubros = ROLL.filter((r) => sel.has(r.k)).flatMap((r) => r.keys);
  // descompone en positivos y negativos sobre los rubros seleccionados
  const split = (a: PtsAgg) => {
    let p = 0, n = 0;
    for (const rk of selRubros) { const v = a.type[rk] || 0; if (v >= 0) p += v; else n += v; }
    return { p, n, net: p + n };
  };
  const rows = teams.map((t) => ({ t, ...split(A(t)) }))
    .sort((a, b) => (sign === "pos" ? b.p - a.p : sign === "neg" ? a.n - b.n : b.net - a.net));
  const maxP = Math.max(1, ...rows.map((r) => r.p));
  const maxN = Math.max(1, ...rows.map((r) => Math.abs(r.n)));
  const metric = (r: { p: number; n: number; net: number }) => (sign === "pos" ? r.p : sign === "neg" ? r.n : r.net);

  const colMM = (key: string) => [Math.min(...teams.map((t) => A(t).type[key])), Math.max(...teams.map((t) => A(t).type[key]))] as const;

  return (
    <>
      <section className="block" style={{ paddingTop: 4 }}>
        <div className="orctrl">
          <div className="orchips">
            <button className={`orchip all ${allOn ? "on" : ""}`} onClick={() => setSel(new Set(ROLL.map((r) => r.k)))}>Todo</button>
            {ROLL.map((r) => (
              <button key={r.k} className={`orchip ${sel.has(r.k) ? "on" : ""}`} style={sel.has(r.k) ? { background: r.c, borderColor: r.c, color: r.k === "bon" ? "#15001a" : "#fff" } : {}} onClick={() => toggle(r.k)}>{r.t}</button>
            ))}
          </div>
          <div className="seg">
            <button className={sign === "net" ? "on" : ""} onClick={() => setSign("net")}>Neto</button>
            <button className={sign === "pos" ? "on" : ""} onClick={() => setSign("pos")}>Positivos</button>
            <button className={sign === "neg" ? "on" : ""} onClick={() => setSign("neg")}>Negativos</button>
          </div>
        </div>
        <div className="panel reveal ptslist">
          {rows.map((r) => (
            <div className="ptsrow" key={r.t.id}>
              <span className="side"><Badge emblem={meta[r.t.id].emblem} short={meta[r.t.id].short} i={meta[r.t.id].i} /><span className="rivn">{meta[r.t.id].name}</span></span>
              <div className="divbar" title={`+${r.p} / ${r.n} = ${r.net}`}>
                <span className="dn">{sign !== "pos" && r.n < 0 ? <i style={{ width: `${(Math.abs(r.n) / maxN) * 100}%` }}>{Math.abs(r.n) / maxN > 0.16 ? r.n : ""}</i> : null}</span>
                <span className="dp">{sign !== "neg" && r.p > 0 ? <i style={{ width: `${(r.p / maxP) * 100}%` }}>{r.p / maxP > 0.12 ? r.p : ""}</i> : null}</span>
              </div>
              <span className="ptsuse" style={{ width: 60, color: metric(r) < 0 ? "var(--pink)" : "var(--mint)" }}>{metric(r)}</span>
            </div>
          ))}
        </div>
        <p className="legendnote">
          Clic en las orientaciones para incluirlas o quitarlas del ranking · <b style={{ color: "var(--mint)" }}>verde = positivos</b> a la derecha, <b style={{ color: "var(--pink)" }}>rojo = negativos</b> a la izquierda (goles en contra, disciplina). «Neto» = positivos − negativos. {selRubros.length < 9 ? "Ranking solo de lo seleccionado." : "Todas las orientaciones."}
        </p>
      </section>

      <section className="block">
        <h2 className="h2">Detalle por <span className="g">rubro</span></h2>
        <p className="kicker">Puntos ganados (o perdidos) en cada categoría seleccionada</p>
        <div className="panel reveal"><div className="matrix"><table className="mx">
          <thead><tr>
            <th className="sticky">Equipo</th>
            {selRubros.map((c) => <th key={c}>{TLABEL[c]}</th>)}
            <th className="tot">Neto</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t.id}>
                <td className="sticky"><div className="team"><Badge emblem={meta[r.t.id].emblem} short={meta[r.t.id].short} i={meta[r.t.id].i} /><div className="nm">{meta[r.t.id].name}</div></div></td>
                {selRubros.map((c) => {
                  const v = A(r.t).type[c]; const [mn, mx] = colMM(c);
                  return <td key={c}><span className="cell" style={{ background: rygColor(v, mn, mx), color: "#15001a" }}>{v}</span></td>;
                })}
                <td className="total"><span className="cell" style={{ fontWeight: 800 }}>{r.net}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
        <p className="legendnote">Goles GKP/DEF=6, MID=5, FWD=4 · Asist.=3 · Portería 0 (DEF/GKP=4, MID=1) · Contr. def.=2 · Atajadas (cada 3=1, +penal atajado) · Bonus=1-3 · negativos: goles en contra y disciplina (tarjetas, autogoles). Sin capitanes ni comodines (es draft).</p>
      </section>
    </>
  );
}

/* ===================== JUGADOR: aporte por jugador del equipo ===================== */
type Ord = "total" | "prom";
function Jugador({ teams, meta, team, setTeam }: { teams: TeamPts[]; meta: any; team: number; setTeam: (id: number) => void }) {
  const [ord, setOrd] = useState<Ord>("total");
  const t = teams.find((x) => x.id === team) ?? teams[0];
  const prom = (p: { sq: number; gp: number }) => (p.gp > 0 ? p.sq / p.gp : 0);
  const players = [...t.players].sort((a, b) => (ord === "prom" ? prom(b) - prom(a) : b.sq - a.sq));
  const maxSq = Math.max(1, ...players.map((p) => p.sq));
  const maxPr = Math.max(1, ...players.map(prom));
  return (
    <>
      <section className="block" style={{ paddingTop: 4 }}>
        <div className="teamsel">
          {teams.map((x) => (
            <button key={x.id} className={x.id === team ? "on" : ""} onClick={() => setTeam(x.id)} title={meta[x.id].name}>
              <Badge emblem={meta[x.id].emblem} short={meta[x.id].short} i={meta[x.id].i} /><span>{meta[x.id].name}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="block" style={{ paddingTop: 6 }}>
        <div className="secthead">
          <p className="kicker" style={{ margin: 0 }}>{players.length} jugadores vistieron la camiseta de <b>{meta[team].name}</b>. «GJ» = jornadas en plantilla · «Prom» = puntos por jornada (plantilla ÷ GJ). La <b>banca</b> es lo que sumó sin alinearse.</p>
          <div className="seg"><button className={ord === "total" ? "on" : ""} onClick={() => setOrd("total")}>Total</button><button className={ord === "prom" ? "on" : ""} onClick={() => setOrd("prom")}>Promedio</button></div>
        </div>
        <div className="panel reveal plrtable">
          <div className="plr plrhead"><span className="pp" /><span className="pnm">Jugador</span><span className="pv gj">GJ</span><span className="pv">Plant.</span><span className="pv">Titular</span><span className="pv bench">Banca</span><span className="pv">Prom</span></div>
          {players.map((p) => {
            const bench = p.sq - p.xi; const pr = prom(p);
            const w = ord === "prom" ? (pr / maxPr) * 100 : (p.sq / maxSq) * 100;
            return (
              <div className="plr" key={p.el}>
                <span className="pp"><em className="posdot" style={{ background: POSC[p.pos] }}>{p.pos}</em></span>
                <span className="pnm">{p.name}
                  <span className="plbar"><i style={{ width: `${w}%` }} />{ord === "total" ? <b style={{ width: `${(p.xi / maxSq) * 100}%` }} /> : null}</span>
                </span>
                <span className="pv dim gj">{p.gp}</span>
                <span className="pv strong">{p.sq}</span>
                <span className="pv">{p.xi}</span>
                <span className="pv bench" style={{ color: bench > 0 ? "var(--pink)" : "rgba(255,255,255,.35)" }}>{bench > 0 ? bench : "—"}</span>
                <span className="pv" style={{ color: "var(--cyan)" }}>{pr.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <p className="legendnote">Ordenado por {ord === "prom" ? "puntos por jornada (resalta al que rindió mucho en pocas fechas)" : "puntos de plantilla (la franja verde es lo que contó como titular)"}. «Prom» usa las jornadas que estuvo en tu plantilla.</p>
      </section>
    </>
  );
}
