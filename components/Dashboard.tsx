"use client";
import { useEffect, useRef, useState } from "react";

export interface Team {
  rank: number; id: number; name: string; short: string; manager: string;
  played: number; won: number; drawn: number; lost: number;
  pf: number; pa: number; pts: number; eff: number; emblem: string | null;
}
export interface League {
  season: string;
  league: { id: number; name: string; division: string; teams: number; last_event: number };
  standings: Team[];
  progression: { events: number[]; series: { name: string; short: string; rank: number[] }[] };
}

const COLORS = ["#00FF87","#04F5FF","#FF2D78","#FFD166","#A06CD5","#FF8A5B","#5BE7C4","#F8696B","#9D8DF1","#E6E6E6","#FFB3C7","#7FE3FF","#C0F58A","#FF6FB5","#8AD1FF","#FFC97A"];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex = (c: string) => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
const mix = (c1: string, c2: string, t: number) => {
  const a = hex(c1), b = hex(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`;
};
const effColor = (v: number, min: number, max: number) => {
  const t = max > min ? (v - min) / (max - min) : 1;
  return t < 0.5 ? mix("#F8696B","#FFEB84", t/0.5) : mix("#FFEB84","#63BE7B", (t-0.5)/0.5);
};

function buildOption(d: League) {
  return {
    backgroundColor: "transparent",
    color: COLORS,
    grid: { left: 34, right: 18, top: 14, bottom: 74 },
    tooltip: {
      trigger: "axis", backgroundColor: "rgba(42,0,48,.94)", borderColor: "rgba(255,255,255,.14)",
      textStyle: { color: "#fff", fontFamily: "Inter" },
      axisPointer: { type: "line", lineStyle: { color: "rgba(255,255,255,.25)" } },
      valueFormatter: (v: number) => v + ".º",
    },
    legend: { type: "scroll", bottom: 0, textStyle: { color: "#C6B2CC", fontFamily: "Inter" }, inactiveColor: "rgba(255,255,255,.25)", pageTextStyle: { color: "#fff" } },
    xAxis: { type: "category", boundaryGap: false, data: d.progression.events.map((e) => "GW" + e),
      axisLine: { lineStyle: { color: "rgba(255,255,255,.18)" } }, axisLabel: { color: "#9d86a4", fontSize: 10, interval: 3 }, splitLine: { show: false } },
    yAxis: { type: "value", inverse: true, min: 1, max: d.standings.length, interval: 1,
      axisLabel: { color: "#9d86a4", formatter: "{value}.º" }, splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } } },
    animationDuration: 1100, animationEasing: "cubicOut",
    series: d.progression.series.map((s, i) => ({
      name: s.name, type: "line", smooth: true, symbol: "circle", symbolSize: 6, showSymbol: false,
      emphasis: { focus: "series" }, lineStyle: { width: 2.4, color: COLORS[i % COLORS.length] },
      itemStyle: { color: COLORS[i % COLORS.length] }, data: s.rank,
    })),
  };
}

function Crest() {
  return (
    <svg className="crest" viewBox="0 0 64 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00FF87" /><stop offset="1" stopColor="#04F5FF" />
        </linearGradient>
      </defs>
      <path d="M14 20 L22 9 L32 17 L42 9 L50 20 L46 24 H18 Z" fill="url(#cg)" />
      <circle cx="22" cy="9" r="2.6" fill="#04F5FF" /><circle cx="32" cy="6" r="2.6" fill="#00FF87" /><circle cx="42" cy="9" r="2.6" fill="#04F5FF" />
      <path d="M14 26 H50 V42 Q50 60 32 67 Q14 60 14 42 Z" fill="none" stroke="url(#cg)" strokeWidth="3" />
      <text x="32" y="50" textAnchor="middle" fontFamily="Poppins,sans-serif" fontWeight="800" fontSize="17" fill="#fff">VII</text>
    </svg>
  );
}

export default function Dashboard({ leagues, order }: { leagues: Record<number, League>; order: number[] }) {
  const [sel, setSel] = useState(order[0]);
  const d = leagues[sel];
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: { resize: () => void; dispose: () => void } | null = null;
    let disposed = false;
    import("echarts").then((echarts) => {
      if (disposed || !chartRef.current) return;
      chart = echarts.init(chartRef.current);
      (chart as unknown as { setOption: (o: object) => void }).setOption(buildOption(d));
    });
    const onResize = () => chart?.resize();
    window.addEventListener("resize", onResize);
    return () => { disposed = true; window.removeEventListener("resize", onResize); chart?.dispose(); };
  }, [d]);

  const champ = d.standings[0];
  const effs = d.standings.map((s) => s.eff);
  const emin = Math.min(...effs), emax = Math.max(...effs);
  const isSerieA = sel === 35;

  return (
    <>
      <nav className="nav"><div className="wrap">
        <div className="brand"><Crest /><div>Fantasy Premier League<small>Reporte de Liga · 25/26</small></div></div>
        <div className="switch">
          {order.map((id) => (
            <button key={id} className={id === sel ? "on" : ""} onClick={() => setSel(id)}>
              {id === 35 ? "Serie A" : "Los Boyz"}
            </button>
          ))}
        </div>
      </div></nav>

      <header className="hero"><div className="wrap">
        <span className="divbadge reveal">● {isSerieA ? "Serie A · 10 equipos" : "Los Boyz Draft · 16 equipos"}</span>
        <h1 className="title reveal" style={{ animationDelay: ".05s" }}>Tabla y <span className="g">Rendimiento</span></h1>
        <p className="sub reveal" style={{ animationDelay: ".1s" }}>
          Temporada {d.season} · {d.league.last_event} jornadas disputadas. Campeón:{" "}
          <b style={{ color: "var(--mint)" }}>{champ.name}</b> ({champ.manager}).
        </p>
        <div className="stats reveal" style={{ animationDelay: ".16s" }}>
          <div className="stat"><div className="k">{d.standings.length}</div><div className="l">Equipos</div></div>
          <div className="stat"><div className="k">{d.league.last_event}</div><div className="l">Jornadas</div></div>
          <div className="stat champ">
            {champ.emblem && <img className="champ-emblem" src={`/${champ.emblem}`} alt={champ.name} />}
            <div><div className="k acc" style={{ fontSize: "clamp(15px,2.4vw,21px)" }}>{champ.name}</div><div className="l">Campeón · {champ.pts} pts</div></div>
          </div>
        </div>
      </div></header>

      <main className="wrap">
        <section className="block">
          <h2 className="h2">La <span className="g">Tabla</span></h2>
          <p className="kicker">Clasificación final · cabeza a cabeza (3 / 1 / 0)</p>
          <div className="panel reveal"><div className="tablewrap"><table>
            <thead><tr>
              <th>#</th><th className="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>PF</th><th>PC</th><th>Pts</th><th>Efic. XI</th>
            </tr></thead>
            <tbody>
              {d.standings.map((s, i) => {
                const ec = effColor(s.eff, emin, emax);
                return (
                  <tr key={s.id} className={i < 3 ? `top${i + 1}` : ""}>
                    <td><div className="rankcell">{s.rank}</div></td>
                    <td className="l"><div className="team">
                      {s.emblem
                        ? <img className="badge" src={`/${s.emblem}`} alt={s.name} loading="lazy" />
                        : <div className="badge" style={{ background: `linear-gradient(160deg,${COLORS[i % COLORS.length]},${COLORS[(i + 3) % COLORS.length]})` }}>{s.short}</div>}
                      <div><div className="nm">{s.name}</div><div className="mg">{s.manager}</div></div>
                    </div></td>
                    <td>{s.played}</td><td className="win">{s.won}</td><td>{s.drawn}</td><td className="los">{s.lost}</td>
                    <td>{s.pf}</td><td style={{ color: "var(--muted)" }}>{s.pa}</td>
                    <td className="pts">{s.pts}</td>
                    <td><div className="effcell">
                      <div className="effbar"><span style={{ width: `${Math.round(s.eff * 100)}%`, background: ec }} /></div>
                      <span className="effval" style={{ color: ec }}>{(s.eff * 100).toFixed(1)}%</span>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div></div>
        </section>

        <section className="block">
          <h2 className="h2">Progreso de la <span className="g">Tabla</span></h2>
          <p className="kicker">Posición por jornada · pasa el cursor para el detalle · toca la leyenda para aislar un equipo</p>
          <div className="panel reveal" style={{ padding: 18 }}><div className="chart" ref={chartRef} /></div>
          <p className="legendnote">Eje invertido: arriba = 1.º. Datos reconstruidos y validados al 100% contra el API oficial.</p>
        </section>
      </main>

      <footer><div className="wrap">
        Reporte generado desde datos archivados del API de draft · <b>Fantasy Premier League VII</b>
        <span className="pill">core</span>
      </div></footer>
    </>
  );
}
