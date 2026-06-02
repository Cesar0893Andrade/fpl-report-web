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
  const roll = (a: PtsAgg, k: string) => ROLL.find((r) => r.k === k)!.keys.reduce((s, key) => s + (a.type[key] || 0), 0);
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
      {view === "tipo" && <Tipo teams={teams} meta={meta} A={A} roll={roll} />}
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

/* ===================== TIPO: orientación + detalle por rubro ===================== */
function Tipo({ teams, meta, A, roll }: { teams: TeamPts[]; meta: any; A: (t: TeamPts) => PtsAgg; roll: (a: PtsAgg, k: string) => number }) {
  const tcols = teams[0] ? Object.keys(TLABEL) : [];
  const rows = [...teams].sort((a, b) => A(b).total - A(a).total);
  // base de la barra: suma de los aportes POSITIVOS (presencia+ataque+defensa+bonus)
  const posSum = (t: TeamPts) => ROLL.filter((r) => r.k !== "dis").reduce((s, r) => s + Math.max(0, roll(A(t), r.k)), 0);
  const maxPos = Math.max(1, ...rows.map(posSum));
  const colMM = (key: string) => [Math.min(...teams.map((t) => A(t).type[key])), Math.max(...teams.map((t) => A(t).type[key]))] as const;

  return (
    <>
      <section className="block" style={{ paddingTop: 4 }}>
        <div className="legendchips">
          <span>Orientación:</span>
          {ROLL.map((r) => <em className="ck" key={r.k} style={{ background: r.c, color: r.k === "bon" ? "#15001a" : "#fff" }}>{r.t}</em>)}
        </div>
        <div className="panel reveal ptslist">
          {rows.map((t) => (
            <div className="ptsrow" key={t.id}>
              <span className="side"><Badge emblem={meta[t.id].emblem} short={meta[t.id].short} i={meta[t.id].i} /><span className="rivn">{meta[t.id].name}</span></span>
              <div className="ptsbar rollbar">
                {ROLL.filter((r) => r.k !== "dis").map((r) => {
                  const v = Math.max(0, roll(A(t), r.k));
                  if (!v) return null;
                  return <span key={r.k} style={{ width: `${(v / maxPos) * 100}%`, background: r.c }} title={`${r.t}: ${roll(A(t), r.k)}`}>{v / maxPos > 0.07 ? v : ""}</span>;
                })}
              </div>
              <span className="ptsuse" style={{ width: 64 }}>{A(t).total}</span>
            </div>
          ))}
        </div>
        <p className="legendnote">Composición de los puntos por orientación (barra = suma de aportes positivos). El detalle exacto, incluido lo negativo (goles en contra, disciplina), está abajo.</p>
      </section>

      <section className="block">
        <h2 className="h2">Detalle por <span className="g">rubro</span></h2>
        <p className="kicker">Puntos ganados (o perdidos) en cada categoría de puntuación FPL</p>
        <div className="panel reveal"><div className="matrix"><table className="mx">
          <thead><tr>
            <th className="sticky">Equipo</th>
            {tcols.map((c) => <th key={c}>{TLABEL[c]}</th>)}
            <th className="tot">Total</th>
          </tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="sticky"><div className="team"><Badge emblem={meta[t.id].emblem} short={meta[t.id].short} i={meta[t.id].i} /><div className="nm">{meta[t.id].name}</div></div></td>
                {tcols.map((c) => {
                  const v = A(t).type[c]; const [mn, mx] = colMM(c);
                  return <td key={c}><span className="cell" style={{ background: rygColor(v, mn, mx), color: "#15001a" }}>{v}</span></td>;
                })}
                <td className="total"><span className="cell" style={{ fontWeight: 800 }}>{A(t).total}</span></td>
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
function Jugador({ teams, meta, team, setTeam }: { teams: TeamPts[]; meta: any; team: number; setTeam: (id: number) => void }) {
  const t = teams.find((x) => x.id === team) ?? teams[0];
  const players = t.players;
  const maxSq = Math.max(1, ...players.map((p) => p.sq));
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
        <p className="kicker">{players.length} jugadores vistieron la camiseta de <b>{meta[team].name}</b>. «Plantilla» = todo lo que sumó mientras lo tuviste; «Titular» = solo cuando lo alineaste. La diferencia es lo que se quedó en tu banca.</p>
        <div className="panel reveal plrtable">
          <div className="plr plrhead"><span className="pp" /><span className="pnm">Jugador</span><span className="pv">Plantilla</span><span className="pv">Titular</span><span className="pv">Banca</span></div>
          {players.map((p) => {
            const bench = p.sq - p.xi;
            return (
              <div className="plr" key={p.el}>
                <span className="pp"><em className="posdot" style={{ background: POSC[p.pos] }}>{p.pos}</em></span>
                <span className="pnm">{p.name}
                  <span className="plbar"><i style={{ width: `${(p.sq / maxSq) * 100}%` }} /><b style={{ width: `${(p.xi / maxSq) * 100}%` }} /></span>
                </span>
                <span className="pv strong">{p.sq}</span>
                <span className="pv">{p.xi}</span>
                <span className="pv" style={{ color: bench > 0 ? "var(--pink)" : "rgba(255,255,255,.35)" }}>{bench > 0 ? bench : "—"}</span>
              </div>
            );
          })}
        </div>
        <p className="legendnote">Ordenado por puntos de plantilla. La barra clara es el total acumulado; la franja verde, lo que contó como titular.</p>
      </section>
    </>
  );
}
