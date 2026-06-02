"use client";
import { useState } from "react";
import { League } from "@/lib/types";
import Crest from "@/components/Crest";
import Resumen from "@/components/Resumen";
import Performance from "@/components/Performance";
import Versus from "@/components/Versus";
import Plantillas from "@/components/Plantillas";
import Puntos from "@/components/Puntos";
import Copa from "@/components/Copa";

type Tab = "resumen" | "rendimiento" | "versus" | "plantillas" | "puntos" | "copa";

export default function Dashboard({ leagues, order }: { leagues: Record<number, League>; order: number[] }) {
  const [sel, setSel] = useState(order[0]);
  const [tab, setTab] = useState<Tab>("resumen");
  const d = leagues[sel];
  const champ = d.standings[0];
  const isSerieA = sel === 35;

  return (
    <>
      <nav className="nav"><div className="wrap">
        <div className="brand"><Crest /><div>Fantasy Premier League<small>Reporte de Liga · 25/26</small></div></div>
        <div className="switch">
          {order.map((id) => (
            <button key={id} className={id === sel ? "on" : ""} onClick={() => { setSel(id); if (id !== 35 && tab === "copa") setTab("resumen"); }}>
              {id === 35 ? "Serie A" : "Los Boyz"}
            </button>
          ))}
        </div>
      </div></nav>

      <header className="hero"><div className="wrap">
        <span className="divbadge reveal">● {isSerieA ? "Serie A · 10 equipos" : "Los Boyz Draft · 16 equipos"}</span>
        <h1 className="title reveal" style={{ animationDelay: ".05s" }}>Reporte de <span className="g">Liga</span></h1>
        <p className="sub reveal" style={{ animationDelay: ".1s" }}>
          Temporada {d.season} · {d.league.last_event} jornadas. Campeón:{" "}
          <b style={{ color: "var(--mint)" }}>{champ.name}</b> ({champ.manager}).
        </p>
        <div className={`stats reveal ${isSerieA && d.copa ? "s4" : ""}`} style={{ animationDelay: ".16s" }}>
          <div className="stat"><div className="k">{d.standings.length}</div><div className="l">Equipos</div></div>
          <div className="stat"><div className="k">{d.league.last_event}</div><div className="l">Jornadas</div></div>
          <div className="stat champ">
            {champ.emblem && <img className="champ-emblem" src={`/${champ.emblem}`} alt={champ.name} />}
            <div><div className="k acc" style={{ fontSize: "clamp(15px,2.4vw,21px)" }}>{champ.name}</div><div className="l">Campeón de Liga · {champ.pts} pts</div></div>
          </div>
          {isSerieA && d.copa && (
            <div className="stat champ cup">
              {d.copa.champion.emblem
                ? <img className="champ-emblem" src={`/${d.copa.champion.emblem}`} alt={d.copa.champion.name} />
                : null}
              <div><div className="k gold" style={{ fontSize: "clamp(15px,2.4vw,21px)" }}>{d.copa.champion.name}</div><div className="l">🏆 Campeón de Copa</div></div>
            </div>
          )}
        </div>
      </div></header>

      <main className="wrap">
        <div className="tabs">
          <button className={tab === "resumen" ? "on" : ""} onClick={() => setTab("resumen")}>Resumen</button>
          <button className={tab === "rendimiento" ? "on" : ""} onClick={() => setTab("rendimiento")}>Rendimiento</button>
          <button className={tab === "versus" ? "on" : ""} onClick={() => setTab("versus")}>Versus</button>
          <button className={tab === "plantillas" ? "on" : ""} onClick={() => setTab("plantillas")}>Plantillas</button>
          <button className={tab === "puntos" ? "on" : ""} onClick={() => setTab("puntos")}>Puntos</button>
          {isSerieA && d.copa && <button className={`cup ${tab === "copa" ? "on" : ""}`} onClick={() => setTab("copa")}>🏆 Copa</button>}
        </div>
        {tab === "resumen" ? <Resumen d={d} /> : tab === "rendimiento" ? <Performance d={d} /> : tab === "versus" ? <Versus d={d} /> : tab === "plantillas" ? <Plantillas d={d} /> : tab === "copa" ? (d.copa ? <Copa d={d} /> : <Resumen d={d} />) : <Puntos d={d} />}
      </main>

      <footer><div className="wrap">
        Reporte generado desde datos archivados del API de draft · <b>Fantasy Premier League VII</b>
        <span className="pill">en construcción</span>
      </div></footer>
    </>
  );
}
