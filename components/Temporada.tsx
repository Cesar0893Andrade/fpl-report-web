"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Crest from "@/components/Crest";
import Resumen from "@/components/Resumen";
import Performance from "@/components/Performance";
import Versus from "@/components/Versus";
import Plantillas from "@/components/Plantillas";
import Puntos from "@/components/Puntos";
import Modelo from "@/components/Modelo";
import { LigaAnalitica } from "@/lib/typesAnalytics";

type Tab = "resumen" | "puntos" | "modelo" | "rendimiento" | "versus" | "plantillas";

const TABS: { k: Tab; t: string }[] = [
  { k: "resumen", t: "Resumen" },
  { k: "puntos", t: "Puntos" },
  { k: "modelo", t: "Modelo" },
  { k: "rendimiento", t: "Rendimiento" },
  { k: "versus", t: "Versus" },
  { k: "plantillas", t: "Plantillas" },
];

export default function Temporada({ d }: { d: LigaAnalitica }) {
  const [tab, setTab] = useState<Tab>("resumen");
  const nGw = d.league.last_event;
  const lider = d.standings[0];

  // Mejor puntaje individual de una jornada en lo que va de temporada.
  const best = useMemo(() => {
    let out = { name: "-", short: "", pts: 0, gw: 0 };
    d.performance.rows.forEach((r) => {
      r.points.forEach((p, j) => {
        if (p > out.pts) out = { name: r.name, short: r.short, pts: p, gw: d.performance.events[j] };
      });
    });
    return out;
  }, [d.performance]);

  const effAvg = d.standings.reduce((a, s) => a + s.eff, 0) / d.standings.length;
  const perfectos = d.standings.filter((s) => s.eff >= 0.9999).length;

  return (
    <>
      <nav className="nav"><div className="wrap">
        <div className="brand">
          <Crest text="VIII" />
          <div>Fantasy Premier League VIII<small>La temporada · 2026-27</small></div>
        </div>
        <Link className="navlink" href="/">&larr; Portada</Link>
        <Link className="navlink" href="/ligas-pasadas">Ligas pasadas &rarr;</Link>
      </div></nav>

      <header className="hero"><div className="wrap">
        <span className="divbadge reveal">
          &#9679; {nGw} {nGw === 1 ? "jornada disputada" : "jornadas disputadas"} de 38
        </span>
        <h1 className="title reveal" style={{ animationDelay: ".05s" }}>
          La <span className="g">temporada</span>
        </h1>
        <p className="sub reveal" style={{ animationDelay: ".1s" }}>
          Todo lo que llevamos: la tabla, de dónde salen los puntos, quién alinea bien y qué tan
          cerca estuvo el pronóstico de la realidad. Se actualiza al cierre de cada jornada.
        </p>
        <div className="stats live4 reveal" style={{ animationDelay: ".16s" }}>
          <div className="stat champ">
            {lider.emblem && <img className="champ-emblem" src={`/${lider.emblem}`} alt={lider.name} />}
            <div>
              <div className="k acc" style={{ fontSize: "clamp(15px,2.4vw,21px)" }}>{lider.name}</div>
              <div className="l">Líder · {lider.pts} pts</div>
            </div>
          </div>
          <div className="stat">
            <div className="k" style={{ fontSize: "clamp(22px,3.4vw,32px)" }}>{best.pts}</div>
            <div className="l">Mejor jornada · {best.short} en GW{best.gw}</div>
          </div>
          <div className="stat">
            <div className="k acc" style={{ fontSize: "clamp(22px,3.4vw,32px)" }}>{(effAvg * 100).toFixed(0)}%</div>
            <div className="l">Eficiencia media de alineación</div>
          </div>
          <div className="stat">
            <div className="k" style={{ fontSize: "clamp(22px,3.4vw,32px)" }}>{perfectos}<small style={{ color: "var(--muted)", fontSize: 17 }}>/{d.standings.length}</small></div>
            <div className="l">Equipos con el XI perfecto</div>
          </div>
        </div>
      </div></header>

      <main className="wrap">
        <div className="tabs">
          {TABS.map((x) => (
            <button key={x.k} className={tab === x.k ? "on" : ""} onClick={() => setTab(x.k)}>{x.t}</button>
          ))}
        </div>
        {tab === "resumen" && <Resumen d={d} live />}
        {tab === "puntos" && <Puntos d={d} />}
        {tab === "modelo" && <Modelo d={d} />}
        {tab === "rendimiento" && <Performance d={d} />}
        {tab === "versus" && <Versus d={d} />}
        {tab === "plantillas" && <Plantillas d={d} />}
      </main>

      <footer><div className="wrap">
        draftfpl.app · <b>Fantasy Premier League VIII</b> · datos del API oficial de draft
        <span className="pill">temporada en curso</span>
      </div></footer>
    </>
  );
}
