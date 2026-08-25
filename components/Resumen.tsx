"use client";
import { useEffect, useRef } from "react";
import { League } from "@/lib/types";
import { COLORS, rygColor } from "@/lib/colors";

function buildOption(d: League) {
  return {
    backgroundColor: "transparent", color: COLORS,
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

export default function Resumen({ d, live = false }: { d: League; live?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  // Con una sola jornada el grafico de progreso es un punto suelto: no se monta.
  const showProg = d.progression.events.length > 1;
  useEffect(() => {
    if (!showProg) return;
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
  }, [d, showProg]);

  const effs = d.standings.map((s) => s.eff);
  const emin = Math.min(...effs), emax = Math.max(...effs);

  return (
    <>
      <section className="block">
        <h2 className="h2">La <span className="g">Tabla</span></h2>
        <p className="kicker">
          {live
            ? `Clasificación tras ${d.league.last_event} ${d.league.last_event === 1 ? "jornada" : "jornadas"} · cabeza a cabeza (3 / 1 / 0)`
            : "Clasificación final · cabeza a cabeza (3 / 1 / 0)"}
        </p>
        <div className="panel reveal"><div className="tablewrap"><table>
          <thead><tr>
            <th>#</th><th className="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>PF</th><th>PC</th><th>Pts</th><th>Pos/GW</th><th>Efic. XI</th>
          </tr></thead>
          <tbody>
            {d.standings.map((s, i) => {
              const ec = rygColor(s.eff, emin, emax);
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
                  <td style={{ fontFamily: "var(--h)", fontWeight: 700, color: "var(--cyan)" }} title="Posición promedio por jornada (menor = mejor)">{s.avg_rank.toFixed(1)}</td>
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

      {showProg ? (
        <section className="block">
          <h2 className="h2">Progreso de la <span className="g">Tabla</span></h2>
          <p className="kicker">Posición por jornada · pasa el cursor para el detalle · toca la leyenda para aislar un equipo</p>
          <div className="panel reveal" style={{ padding: 18 }}><div className="chart" ref={chartRef} /></div>
          <p className="legendnote">Eje invertido: arriba = 1.º. Datos reconstruidos y validados al 100% contra el API oficial.</p>
        </section>
      ) : (
        <section className="block">
          <h2 className="h2">Progreso de la <span className="g">Tabla</span></h2>
          <p className="kicker">
            La curva de posiciones aparece a partir de la segunda jornada: con una sola fecha
            todavía no hay recorrido que dibujar.
          </p>
        </section>
      )}
    </>
  );
}
