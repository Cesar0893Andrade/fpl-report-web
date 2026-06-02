"use client";
import { League, CopaSeries, CopaTeam } from "@/lib/types";
import Badge from "@/components/Badge";

export default function Copa({ d }: { d: League }) {
  const copa = d.copa;
  if (!copa) return null;
  const idx: Record<number, number> = Object.fromEntries(d.standings.map((s, i) => [s.id, i]));
  const champ = copa.champion;

  const Team = ({ t, win, right }: { t: CopaTeam; win: boolean; right?: boolean }) => (
    <div className={`cteam ${win ? "win" : ""} ${right ? "r" : ""}`}>
      <Badge emblem={t.emblem} short={t.short} i={idx[t.id] ?? t.seed - 1} />
      <div className="ct-tx">
        <span className="ct-nm">{win && <i className="ck-tick">✓</i>}{t.name}</span>
        <span className="ct-sd">Siembra #{t.seed}</span>
      </div>
    </div>
  );

  const note = (s: CopaSeries) => {
    const w = s.winner === s.a.id ? s.a : s.b;
    const hi = Math.max(s.winsA, s.winsB), lo = Math.min(s.winsA, s.winsB);
    if (s.why === "gw") return `${w.name} ganó la serie ${hi}–${lo}`;
    if (s.why === "pts") return `Serie ${s.winsA}–${s.winsB} · ${w.name} avanza por puntos a favor (${Math.max(s.ptsA, s.ptsB)}–${Math.min(s.ptsA, s.ptsB)})`;
    return `${w.name} avanza por mejor siembra`;
  };

  const Serie = ({ s }: { s: CopaSeries }) => {
    const aWin = s.winner === s.a.id;
    return (
      <div className="copaser panel reveal">
        <div className="cs-head">
          <Team t={s.a} win={aWin} />
          <div className="cs-score"><span className={aWin ? "hl" : ""}>{s.winsA}</span><i>–</i><span className={!aWin ? "hl" : ""}>{s.winsB}</span></div>
          <Team t={s.b} win={!aWin} right />
        </div>
        <div className="cs-gws">
          {s.gws.map((g) => (
            <span className={`csg ${g.dead ? "dead" : ""}`} key={g.gw} title={g.dead ? "No se jugó · la serie ya estaba definida" : undefined}>
              <em>GW{g.gw}</em>
              <span className="csg-sc"><b className={!g.dead && g.w === "a" ? "hl" : ""}>{g.a}</b><i>-</i><b className={!g.dead && g.w === "b" ? "hl" : ""}>{g.b}</b></span>
              {g.dead && <em className="csg-x">no jugó</em>}
            </span>
          ))}
        </div>
        <div className="cs-note">{note(s)}</div>
      </div>
    );
  };

  return (
    <>
      <section className="block">
        <div className="copachamp reveal">
          <span className="cc-k">★ Campeón · {copa.name}</span>
          <div className="cc-main">
            {champ.emblem
              ? <img className="cc-emb" src={`/${champ.emblem}`} alt={champ.name} />
              : <Badge emblem={null} short={champ.short} i={idx[champ.id] ?? 0} />}
            <div className="cc-tx">
              <div className="cc-nm">{champ.name}</div>
              <div className="cc-sub">Siembra #{champ.seed} · ganó la final 5 fechas</div>
            </div>
            <span className="cc-trophy">🏆</span>
          </div>
        </div>
        <p className="kicker" style={{ marginTop: 14 }}>
          Torneo de eliminación directa en las últimas 14 jornadas. Siembra por la tabla al cierre del <b>GW{copa.seedEvent}</b>; cada llave se decide por <b>game weeks ganados</b> (H2H por fecha) y, si hay empate, por los <b>puntos a favor</b> de la serie. Sin relación con la tabla de liga (ahí el campeón es otro).
        </p>
      </section>

      {copa.rounds.map((rd) => (
        <section className="block" key={rd.tag} style={{ paddingTop: 6 }}>
          <div className="secthead">
            <h2 className="h2">{rd.name === "Final" ? <span className="g">Final</span> : rd.name}</h2>
            <span className="copagws">GW {rd.gws[0]}–{rd.gws[rd.gws.length - 1]} · {rd.gws.length} fechas</span>
          </div>
          <div className={`copagrid ${rd.series.length === 1 ? "one" : ""}`}>
            {rd.series.map((s) => <Serie key={s.m} s={s} />)}
          </div>
        </section>
      ))}

      <section className="block">
        <h2 className="h2">Siembra <span className="g">inicial</span></h2>
        <p className="kicker">Posiciones al cierre del GW{copa.seedEvent}: 1–6 pasan directo a cuartos (bye), 7–10 arrancan en el playoff</p>
        <div className="panel reveal seedlist">
          {copa.seeds.map((t) => (
            <div className={`seedrow ${t.seed <= 6 ? "bye" : ""}`} key={t.id}>
              <span className="sd">{t.seed}</span>
              <Badge emblem={t.emblem} short={t.short} i={idx[t.id] ?? t.seed - 1} />
              <span className="sn">{t.name}</span>
              <span className="stag">{t.seed <= 6 ? "Bye → Cuartos" : "Playoff"}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
