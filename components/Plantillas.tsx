"use client";
import { useMemo, useState } from "react";
import { League, RosterPlayer } from "@/lib/types";
import Badge from "@/components/Badge";

const SRC: Record<string, { t: string; c: string }> = {
  draft: { t: "Draft", c: "#8AD1FF" },
  waiver: { t: "Waiver", c: "#FF8A5B" },
  free: { t: "Free agent", c: "#5BE7C4" },
  trade: { t: "Trade", c: "#A06CD5" },
};
const POS = ["GKP", "DEF", "MID", "FWD"];
const srcOf = (type: string) => (type === "trade" ? "trade" : type === "w" ? "waiver" : "free");

export default function Plantillas({ d }: { d: League }) {
  const { draft, moves } = d.rosters;
  const lastEv = d.league.last_event;
  const teams = d.standings.map((s) => ({ id: s.id, name: s.name, short: s.short, emblem: s.emblem }));
  const [team, setTeam] = useState(teams[0]?.id ?? 0);
  const [gw, setGw] = useState(0); // 0 = Draft (origen); 1..38 = al cierre de esa jornada

  const idx = (id: number) => teams.findIndex((t) => t.id === id);
  const teamMoves = useMemo(() => moves.filter((m) => m.lentry === team), [moves, team]);

  // replay: roster del equipo al cierre del GW seleccionado
  const roster = useMemo(() => {
    const m = new Map<number, RosterPlayer & { source: string }>();
    (draft[String(team)] || []).forEach((p) => m.set(p.el, { ...p, source: "draft" }));
    teamMoves.filter((mv) => mv.event <= gw).forEach((mv) => {
      m.delete(mv.outEl);
      m.set(mv.inEl, { el: mv.inEl, name: mv.inName, pos: mv.inPos, source: srcOf(mv.type) });
    });
    return Array.from(m.values());
  }, [draft, team, gw, teamMoves]);

  const byPos = (p: string) => roster.filter((r) => r.pos === p);
  const comp = roster.reduce((a, r) => { a[r.source] = (a[r.source] || 0) + 1; return a; }, {} as Record<string, number>);
  const movesUpTo = teamMoves.filter((m) => m.event <= gw).length;

  // liga: más activos (movimientos totales por equipo)
  const activity = teams.map((t) => ({ ...t, n: moves.filter((m) => m.lentry === t.id).length }))
    .sort((a, b) => b.n - a.n);
  const maxAct = Math.max(1, ...activity.map((a) => a.n));

  return (
    <>
      <section className="block">
        <h2 className="h2">Evolución de <span className="g">plantillas</span></h2>
        <p className="kicker">Cómo cambió el roster de cada equipo: draft → waivers/free agency/trades, jornada a jornada. Color por cómo llegó cada jugador (si lo soltaste y volvió por waiver, cuenta como waiver).</p>
        <div className="teamsel">
          {teams.map((t, i) => (
            <button key={t.id} className={t.id === team ? "on" : ""} onClick={() => setTeam(t.id)} title={t.name}>
              <Badge emblem={t.emblem} short={t.short} i={i} /><span>{t.name}</span>
            </button>
          ))}
        </div>
        <div className="gwslider">
          <span>{gw === 0 ? <>Plantilla del <b style={{ color: SRC.draft.c }}>Draft</b> (origen)</> : <>Plantilla al cierre del <b>GW {gw}</b></>}</span>
          <input type="range" min={0} max={lastEv} value={gw} onChange={(e) => setGw(+e.target.value)} />
          <span className="legendmini">{Object.entries(SRC).map(([k, v]) => <em key={k} style={{ background: v.c }}>{v.t}</em>)}</span>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 6 }}>
        <div className="rostergrid">
          {POS.map((p) => (
            <div className="poscol panel reveal" key={p}>
              <div className="poshead">{p} <span>{byPos(p).length}</span></div>
              {byPos(p).map((r) => (
                <div className="pchip" key={r.el} style={{ borderColor: SRC[r.source].c }}>
                  <span className="pdot" style={{ background: SRC[r.source].c }} />
                  <span className="pname">{r.name}</span>
                </div>
              ))}
              {byPos(p).length === 0 && <div className="pempty">—</div>}
            </div>
          ))}
        </div>
        <div className="compbar">
          {Object.keys(SRC).map((k) => comp[k] ? (
            <span key={k} style={{ width: `${(comp[k] / roster.length) * 100}%`, background: SRC[k].c }} title={`${comp[k]} ${SRC[k].t}`}>{comp[k]}</span>
          ) : null)}
        </div>
        <p className="legendnote">Composición del XV: {Object.keys(SRC).map((k) => comp[k] ? `${comp[k]} ${SRC[k].t.toLowerCase()}` : null).filter(Boolean).join(" · ")} · {gw === 0 ? "plantilla original del draft, sin movimientos." : `${movesUpTo} movimiento${movesUpTo === 1 ? "" : "s"} desde el draft hasta el GW ${gw}.`}</p>
      </section>

      <div className="splitgrid">
        <section className="block">
          <h2 className="h2"><span className="g">Movimientos</span></h2>
          <p className="kicker">Quién entró y salió, y bajo qué tipo</p>
          <div className="panel reveal movlog">
            {teamMoves.length === 0 && <div className="pempty" style={{ padding: 16 }}>Sin movimientos.</div>}
            {teamMoves.map((m, i) => {
              const s = SRC[srcOf(m.type)];
              return (
                <div className={`movrow ${m.event > gw ? "future" : ""}`} key={i}>
                  <span className="mgw">GW{m.event}</span>
                  <span className="mtype" style={{ background: s.c }}>{s.t}</span>
                  <span className="min" title="entró">↑ {m.inName}</span>
                  <span className="mout" title="salió">↓ {m.outName}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="block">
          <h2 className="h2"><span className="g">Más activos</span></h2>
          <p className="kicker">Total de movimientos de plantilla en la temporada</p>
          <div className="panel reveal" style={{ padding: "8px 16px" }}>
            {activity.map((t) => (
              <div className="actrow" key={t.id} onClick={() => setTeam(t.id)}>
                <span className="side"><Badge emblem={t.emblem} short={t.short} i={idx(t.id)} /><span className="rivn">{t.name}</span></span>
                <div className="actbar"><span style={{ width: `${(t.n / maxAct) * 100}%` }} /></div>
                <span className="actn">{t.n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
