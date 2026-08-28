"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Crest from "@/components/Crest";
import Badge from "@/components/Badge";
import GameClock from "@/components/GameClock";
import { LeagueLive, TeamLive, DraftPick, EmbargoPlayer, GwMatch, Predicciones, PredMatchup } from "@/lib/typesLive";

const POSC: Record<string, string> = { GKP: "#FFD166", DEF: "#04F5FF", MID: "#00FF87", FWD: "#FF2D78" };
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fmtAdded(iso: string) {
  const t = new Date(iso);
  return `${t.getUTCDate()}-${MES[t.getUTCMonth()]}`;
}

function PosChip({ pos }: { pos: string }) {
  return <em className="posdot" style={{ background: POSC[pos] || "#D6DDE6" }}>{pos}</em>;
}

// Mini-tabla de modelos enmascarados (ENS/FPLR/SL/TA) para un cruce.
// pm.a puede venir invertido respecto de la card: se reorienta con flip.
const PRED_ORDER = ["ENS", "FPLR", "SL", "TA"];

function PredMini({ pm, m, aShort, bShort }: { pm: PredMatchup; m: GwMatch; aShort: string; bShort: string }) {
  const flip = pm.a !== m.a;
  const ta = pm.by_model["TA"];
  const taPartial = !!ta && Math.min(ta.cov_a ?? 15, ta.cov_b ?? 15) < 15;
  return (
    <div className="predbox">
      {PRED_ORDER.map((mc) => {
        const bm = pm.by_model[mc];
        if (!bm) return null;
        const muA = flip ? bm.mu_b : bm.mu_a;
        const muB = flip ? bm.mu_a : bm.mu_b;
        const pA = flip ? 1 - bm.p_a : bm.p_a;
        const favA = pA >= 0.5;
        const pct = Math.round((favA ? pA : 1 - pA) * 100);
        const wA = muA + muB > 0 ? (muA / (muA + muB)) * 100 : 50;
        const star = mc === "TA" && taPartial;
        return (
          <div className={`predrow${mc === "ENS" ? " ens" : ""}`} key={mc}>
            <span className="mchip">{mc}{star ? "*" : ""}</span>
            <span className="pmu">{muA.toFixed(1)}</span>
            <span className="predbar"><b style={{ width: `${wA}%` }} /></span>
            <span className="pmu r">{muB.toFixed(1)}</span>
            <span className="predfav">fav: {favA ? aShort : bShort} {pct}%</span>
          </div>
        );
      })}
      {taPartial && <div className="predcov">*cobertura parcial</div>}
    </div>
  );
}

function TeamSide({ t, i, right }: { t: TeamLive; i: number; right?: boolean }) {
  return (
    <div className={`vsteam ${right ? "r" : ""}`}>
      <Badge emblem={t.emblem} short={t.short} i={i} />
      <div>
        <div className="nm">{t.name}</div>
        <div className="mg">{t.manager}</div>
      </div>
    </div>
  );
}

export default function HomeLive({ d, pred }: { d: LeagueLive; pred: Predicciones }) {
  const teamIdx = useMemo(() => {
    const m = new Map<number, { t: TeamLive; i: number }>();
    d.teams.forEach((t, i) => m.set(t.lentry, { t, i }));
    return m;
  }, [d.teams]);

  const [selTeam, setSelTeam] = useState(d.teams[0].lentry);
  const picksBySel = useMemo(
    () => d.draft.picks.filter((p) => p.lentry === selTeam).sort((a, b) => a.round - b.round),
    [d.draft.picks, selTeam]
  );
  const round1 = useMemo(() => d.draft.picks.filter((p) => p.round === 1).sort((a, b) => a.pick - b.pick), [d.draft.picks]);

  // Countdown (client-only after mount to avoid hydration mismatch)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  const unlockMs = useMemo(() => new Date(d.embargo.unlock_utc).getTime(), [d.embargo.unlock_utc]);
  const remaining = now === null ? null : unlockMs - now;
  const unlocked = remaining !== null && remaining <= 0;
  const cd = remaining !== null && remaining > 0
    ? {
        dd: Math.floor(remaining / 86400000),
        hh: Math.floor((remaining % 86400000) / 3600000),
        mm: Math.floor((remaining % 3600000) / 60000),
      }
    : null;
  const unlockDate = d.embargo.unlock_local.split(" ")[0]; // "3-sep-2026"
  const draftDate = d.league.draft_local.split(" ")[0]; // "17-ago-2026"
  const draftTime = d.league.draft_local.split(" ").slice(1).join(" "); // "20:45 ECT"
  const nEmb = d.embargo.players.length;
  // Pre-GW1 la tabla viene en ceros y el "lider" seria un artefacto del orden: solo hay
  // lider cuando ya se jugo algo.
  const lider = useMemo(() => {
    if (d.standings.reduce((a, s) => a + s.played, 0) === 0) return null;
    const s = d.standings[0];
    const t = teamIdx.get(s.lentry);
    return t ? { pts: s.pts, name: t.t.name, emblem: t.t.emblem } : null;
  }, [d.standings, teamIdx]);

  const tf = (l: number) => teamIdx.get(l);

  // Predicciones de la GW en juego (ausencia elegante si no hay clave)
  const predGw = pred.gws[String(d.gw.event)] ?? null;
  const predFor = (m: GwMatch) =>
    predGw?.matchups.find((x) => (x.a === m.a && x.b === m.b) || (x.a === m.b && x.b === m.a)) ?? null;

  return (
    <>
      <nav className="nav"><div className="wrap">
        <div className="brand">
          <Crest text="VIII" />
          <div>Fantasy Premier League VIII<small>Temporada 2026-27 · Liga Draft H2H</small></div>
        </div>
        <Link className="navlink" href="/temporada">La temporada &rarr;</Link>
        <Link className="navlink" href="/ligas-pasadas">Ligas pasadas &rarr;</Link>
      </div></nav>

      <header className="hero"><div className="wrap">
        <span className="divbadge reveal">&#9679; Liga 747 · Draft H2H · 2026-27</span>
        <h1 className="title reveal" style={{ animationDelay: ".05s" }}>
          {d.league.name.replace(" VIII", "")} <span className="g">VIII</span>
        </h1>
        <p className="sub reveal" style={{ animationDelay: ".1s" }}>
          {d.gw.finished
            ? <>La Jornada {d.gw.event} ya cerró. {lider ? <><b style={{ color: "var(--mint)" }}>{lider.name}</b> manda la tabla</> : "Arrancó la tabla"}
                {d.gw.next ? <> y la Jornada {d.gw.next.event} ya asoma.</> : "."}</>
            : <>La octava edición ya rueda: draft celebrado el {draftDate} ({draftTime}), {d.league.teams} equipos y la Jornada {d.gw.event} en juego.</>}
        </p>
        <div className="stats live4 reveal" style={{ animationDelay: ".16s" }}>
          <div className="stat"><div className="k">{d.league.teams}</div><div className="l">Equipos</div></div>
          <div className="stat">
            <div className="k" style={{ fontSize: "clamp(18px,2.8vw,26px)" }}>Jornada {d.gw.event}</div>
            <div className="l">{d.gw.finished ? "Finalizada" : "En juego"}</div>
          </div>
          <div className="stat champ">
            {lider && <img className="champ-emblem" src={`/${lider.emblem}`} alt={lider.name} />}
            <div>
              <div className="k acc" style={{ fontSize: "clamp(15px,2.4vw,21px)" }}>{lider ? lider.name : "—"}</div>
              <div className="l">Líder · {lider ? `${lider.pts} pts` : "sin jugar"}</div>
            </div>
          </div>
          <div className="stat"><div className="k acc">{nEmb}</div><div className="l">Jugadores en embargo &rarr; GW{d.embargo.unlock_gw}</div></div>
        </div>
      </div></header>

      <main className="wrap">
        {/* ---- Jornada 1 ---- */}
        <section className="block">
          <h2 className="h2">Jornada <span className="g">{d.gw.event}</span></h2>
          <p className="kicker">
            {d.gw.finished
              ? "Resultados finales de los cinco cruces cabeza a cabeza."
              : "Los cinco cruces cabeza a cabeza de la semana."}
          </p>
          {!d.gw.next && !d.gw.matches.some((m: GwMatch) => m.started) && <GameClock g={d.game} />}
          <div className="vsgrid">
            {d.gw.matches.map((m: GwMatch, k: number) => {
              const A = tf(m.a); const B = tf(m.b);
              if (!A || !B) return null;
              const pm = predFor(m);
              return (
                <div className="vscard reveal" key={k} style={{ animationDelay: `${k * 0.04}s` }}>
                  <TeamSide t={A.t} i={A.i} />
                  <div className="vsmid">
                    {m.started
                      ? <>
                          <span className="sc" style={m.finished && m.pa > m.pb ? { color: "var(--mint)" } : undefined}>{m.pa}</span>
                          {" "}&ndash;{" "}
                          <span className="sc" style={m.finished && m.pb > m.pa ? { color: "var(--mint)" } : undefined}>{m.pb}</span>
                          <small>{m.finished ? "final" : "en vivo"}</small>
                        </>
                      : <>vs<small>por jugarse</small></>}
                  </div>
                  <TeamSide t={B.t} i={B.i} right />
                  {pm && <PredMini pm={pm} m={m} aShort={A.t.short} bShort={B.t.short} />}
                </div>
              );
            })}
          </div>
          {predGw && (
            <p className="footnote">
              XI óptimo teórico por modelo sobre cada roster · fuentes enmascaradas
              (ENS = ensamble de la casa) · P(gana) = modelo Φ(Δμ/16). Es el techo de cada
              plantilla, no la alineación que cada quien mandó.{" "}
              {d.gw.finished && (
                <Link href="/temporada" style={{ color: "var(--mint)" }}>
                  ¿Cuánto acertaron? &rarr;
                </Link>
              )}
            </p>
          )}
        </section>

        {/* ---- Lo que viene: reloj de fases + cruces de la proxima jornada ---- */}
        {d.gw.next && (
          <section className="block">
            <h2 className="h2">Lo que <span className="g">viene</span></h2>
            <p className="kicker">
              Jornada {d.gw.next.event} · las fechas que mandan esta semana: trades, waivers y deadline.
            </p>
            <GameClock g={d.game} />
            <div className="vsgrid" style={{ marginTop: 18 }}>
              {d.gw.next.matches.map((m: GwMatch, k: number) => {
                const A = tf(m.a); const B = tf(m.b);
                if (!A || !B) return null;
                return (
                  <div className="vscard reveal" key={k} style={{ animationDelay: `${k * 0.04}s` }}>
                    <TeamSide t={A.t} i={A.i} />
                    <div className="vsmid">vs<small>por jugarse</small></div>
                    <TeamSide t={B.t} i={B.i} right />
                  </div>
                );
              })}
            </div>
            <p className="footnote">
              Las predicciones de la Jornada {d.gw.next.event} se publican después del deadline,
              nunca antes: mientras el mercado esté abierto, el pronóstico es información de juego.
            </p>
          </section>
        )}

        {/* ---- La Tabla ---- */}
        <section className="block">
          <h2 className="h2">La <span className="g">Tabla</span></h2>
          <p className="kicker">Clasificación H2H · victoria 3 pts, empate 1.</p>
          <div className="panel">
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>#</th><th className="l">Equipo</th>
                    <th>PJ</th><th>G</th><th>E</th><th>P</th><th>PF</th><th>PA</th><th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {d.standings.map((s) => {
                    const info = tf(s.lentry);
                    if (!info) return null;
                    const { t, i } = info;
                    return (
                      <tr key={s.lentry} className={s.rank <= 3 && s.played > 0 ? `top${s.rank}` : ""}>
                        <td><div className="rankcell">{s.rank}</div></td>
                        <td className="l">
                          <div className="team">
                            <Badge emblem={t.emblem} short={t.short} i={i} />
                            <div>
                              <div className="nm">{t.name}{t.nuevo && <span className="newchip">NUEVO</span>}</div>
                              <div className="mg">{t.manager}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.played}</td><td className="win">{s.won}</td><td>{s.drawn}</td><td className="los">{s.lost}</td>
                        <td>{s.pf}</td><td>{s.pa}</td><td className="pts">{s.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---- Embargo ---- */}
        <section className="block">
          <h2 className="h2">El <span className="g">Embargo</span></h2>
          <p className="kicker" style={{ maxWidth: 720 }}>
            Jugadores registrados en FPL después del draft de la liga ({draftDate}, {draftTime}). No pueden ser
            fichados por ningún equipo hasta su habilitación: 48 horas después del cierre del mercado de fichajes
            de la Premier League (1-sep-2026, 19:00 UK). Se habilitan para la GW{d.embargo.unlock_gw}.
          </p>
          <div className="cdpanel reveal">
            <div>
              <div className="cdlabel">{unlocked ? "Embargo levantado" : "Se habilitan en"}</div>
              <div className="cdmeta">{d.embargo.unlock_local} · GW{d.embargo.unlock_gw}</div>
            </div>
            {unlocked
              ? <div className="cddone">Habilitados desde el {unlockDate}</div>
              : (
                <div className="cdunits">
                  <div className="cdu"><b>{cd ? cd.dd : "--"}</b><span>días</span></div>
                  <div className="cdu"><b>{cd ? String(cd.hh).padStart(2, "0") : "--"}</b><span>horas</span></div>
                  <div className="cdu"><b>{cd ? String(cd.mm).padStart(2, "0") : "--"}</b><span>min</span></div>
                </div>
              )}
          </div>
          <div className="panel">
            <div className="tablewrap">
              <table className="embt">
                <thead>
                  <tr><th className="l">Jugador</th><th style={{ textAlign: "center" }}>Club</th><th style={{ textAlign: "center" }}>Pos</th><th>Agregado</th></tr>
                </thead>
                <tbody>
                  {d.embargo.players.map((p: EmbargoPlayer) => (
                    <tr key={p.el}>
                      <td className="l embname"><b>{p.web}</b><span className="full">{p.name}</span></td>
                      <td style={{ textAlign: "center" }}><span className="clubtag">{p.club}</span></td>
                      <td style={{ textAlign: "center" }}><PosChip pos={p.pos} /></td>
                      <td>{fmtAdded(p.added_utc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="footnote">
            La lista se recalcula automáticamente con cada actualización del sitio: los fichajes de última hora
            del mercado entran solos al embargo.
          </p>
        </section>

        {/* ---- El Draft ---- */}
        <section className="block">
          <h2 className="h2">El <span className="g">Draft</span></h2>
          <p className="kicker">{d.draft.picks.length} selecciones en {d.draft.rounds} rondas · {draftDate}.</p>

          <div className="cdlabel" style={{ marginBottom: 10 }}>Ronda 1</div>
          <div className="r1strip">
            {round1.map((p: DraftPick) => {
              const info = tf(p.lentry);
              return (
                <div className="pickcard" key={p.pick}>
                  <div className="pk">PICK {p.pick}</div>
                  <div className="pn">{p.name}</div>
                  <div className="pc"><PosChip pos={p.pos} /> {p.club}</div>
                  {info && (
                    <div className="tm"><Badge emblem={info.t.emblem} short={info.t.short} i={info.i} /> {info.t.name}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="teamsel" style={{ marginTop: 14 }}>
            {d.teams.map((t, i) => (
              <button key={t.lentry} className={t.lentry === selTeam ? "on" : ""} onClick={() => setSelTeam(t.lentry)}>
                <Badge emblem={t.emblem} short={t.short} i={i} /> {t.name}
              </button>
            ))}
          </div>
          <div className="panel">
            <div className="tpicks">
              {picksBySel.map((p) => (
                <div className="tpick" key={p.pick}>
                  <span className="rd">R{p.round}</span>
                  <span className="nm">{p.name}</span>
                  {p.auto && <span className="autotag">auto</span>}
                  <PosChip pos={p.pos} />
                  <span className="cl">{p.club}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer><div className="wrap">
        draftfpl.app · <b>Fantasy Premier League VIII</b>
        <span className="pill"><Link href="/ligas-pasadas" style={{ color: "inherit", textDecoration: "none" }}>Ver ligas pasadas</Link></span>
      </div></footer>
    </>
  );
}
