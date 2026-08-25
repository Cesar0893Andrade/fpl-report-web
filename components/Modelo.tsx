"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "@/components/Badge";
import { LigaAnalitica, Modelo as ModeloData, ModeloMatchup } from "@/lib/typesAnalytics";

// Los proveedores van enmascarados a proposito: ENS es el ensamble de la casa, el resto
// son fuentes externas cuyo nombre no se publica. Se usan LOS MISMOS codigos que las
// tarjetas de la portada: renombrarlos aqui no anadiria mascara (se alinean por orden) y
// solo obligaria al lector a mantener dos vocabularios.
const MLABEL: Record<string, string> = { ENS: "ENS", FPLR: "FPLR", SL: "SL", TA: "TA" };
const MCOLOR: Record<string, string> = {
  ENS: "#00FF87", FPLR: "#04F5FF", SL: "#FFD166", TA: "#A06CD5",
};

function Scatter({ m, model }: { m: ModeloData; model: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let chart: { resize: () => void; dispose: () => void } | null = null;
    let disposed = false;
    const vals = m.scatter.flatMap((p) => [p.real, p.pred[model] ?? p.real]);
    const lo = Math.floor(Math.min(...vals) / 5) * 5 - 5;
    const hi = Math.ceil(Math.max(...vals) / 5) * 5 + 5;
    import("echarts").then((echarts) => {
      if (disposed || !ref.current) return;
      chart = echarts.init(ref.current);
      (chart as unknown as { setOption: (o: object) => void }).setOption({
        backgroundColor: "transparent",
        grid: { left: 52, right: 22, top: 18, bottom: 46 },
        tooltip: {
          backgroundColor: "rgba(42,0,48,.94)", borderColor: "rgba(255,255,255,.14)",
          textStyle: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
          formatter: (p: { data: number[] }) =>
            `pronosticado <b>${p.data[0].toFixed(1)}</b><br/>real <b>${p.data[1]}</b><br/>` +
            `error ${(p.data[0] - p.data[1]).toFixed(1)}`,
        },
        xAxis: {
          type: "value", min: lo, max: hi, name: "pronosticado", nameLocation: "middle", nameGap: 28,
          nameTextStyle: { color: "#9d86a4", fontSize: 11 },
          axisLine: { lineStyle: { color: "rgba(255,255,255,.18)" } },
          axisLabel: { color: "#9d86a4", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } },
        },
        yAxis: {
          type: "value", min: lo, max: hi, name: "real", nameLocation: "middle", nameGap: 34,
          nameTextStyle: { color: "#9d86a4", fontSize: 11 },
          axisLine: { lineStyle: { color: "rgba(255,255,255,.18)" } },
          axisLabel: { color: "#9d86a4", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } },
        },
        series: [
          {
            type: "line", data: [[lo, lo], [hi, hi]], showSymbol: false, silent: true,
            lineStyle: { color: "rgba(255,255,255,.28)", width: 1, type: "dashed" },
          },
          {
            type: "scatter", symbolSize: 13,
            itemStyle: { color: MCOLOR[model], opacity: 0.85, borderColor: "rgba(0,0,0,.35)" },
            data: m.scatter.map((p) => [p.pred[model] ?? 0, p.real]),
          },
        ],
        animationDuration: 800,
      });
    });
    const onResize = () => chart?.resize();
    window.addEventListener("resize", onResize);
    return () => { disposed = true; window.removeEventListener("resize", onResize); chart?.dispose(); };
  }, [m, model]);
  return <div className="chart sm" ref={ref} />;
}

export default function Modelo({ d }: { d: LigaAnalitica }) {
  const m = d.modelo;
  const [model, setModel] = useState("ENS");
  const meta = useMemo(
    () => Object.fromEntries(d.standings.map((s, i) => [s.id, { name: s.name, short: s.short, emblem: s.emblem, i }])),
    [d.standings]
  );

  if (!m) {
    return (
      <section className="block">
        <h2 className="h2">El <span className="g">modelo</span></h2>
        <p className="kicker">Todavía no hay jornadas cerradas con predicción publicada que medir.</p>
      </section>
    );
  }

  const ens = m.resumen.ENS;
  const nGw = m.events.length;
  // "mejor" solo si gana en solitario: con empate, coronar al primero de la lista seria
  // inventar un orden que los datos no tienen.
  const minBrier = Math.min(...m.models.map((x) => m.resumen[x].brier));
  const empatados = m.models.filter((x) => m.resumen[x].brier === minBrier);
  const best = empatados.length === 1 ? empatados[0] : null;

  return (
    <>
      <section className="block">
        <h2 className="h2">¿Cuánto acertó el <span className="g">modelo</span>?</h2>
        <p className="kicker" style={{ maxWidth: 760 }}>
          Cada jornada, justo después del deadline, se publica un pronóstico del puntaje de cada
          equipo y una probabilidad de victoria para cada cruce. Aquí se contrasta con lo que
          realmente pasó — sin retocar nada a posteriori.
        </p>

        <div className="stats live4">
          <div className="stat">
            <div className="k" style={{ fontSize: "clamp(24px,3.6vw,34px)" }}>{ens.mae.toFixed(1)}</div>
            <div className="l">Error medio · puntos por equipo</div>
          </div>
          <div className="stat">
            <div className="k acc" style={{ fontSize: "clamp(24px,3.6vw,34px)" }}>
              {ens.bias > 0 ? "+" : ""}{ens.bias.toFixed(1)}
            </div>
            <div className="l">Sesgo · {Math.abs(ens.bias) < 1 ? "sin inclinación" : ens.bias > 0 ? "pronostica de más" : "pronostica de menos"}</div>
          </div>
          <div className="stat">
            <div className="k" style={{ fontSize: "clamp(24px,3.6vw,34px)" }}>{ens.h2h}<small style={{ color: "var(--muted)", fontSize: 18 }}>/{ens.n_h2h}</small></div>
            <div className="l">Cruces con el favorito correcto</div>
          </div>
          <div className="stat">
            <div className="k acc" style={{ fontSize: "clamp(24px,3.6vw,34px)" }}>{m.margen_medio_real.toFixed(1)}</div>
            <div className="l">Margen real medio · el ruido de una semana vale {m.sigma.toFixed(0)}</div>
          </div>
        </div>

        <div className="panel modnote">
          <b>Cómo leer esto.</b> El pronóstico clavó el <em>nivel</em> de la liga y falló el{" "}
          <em>ganador</em> de casi todos los cruces, y las dos cosas son ciertas a la vez. En{" "}
          {nGw === 1 ? "la jornada medida" : `las ${nGw} jornadas medidas`} el margen real promedió{" "}
          <b>{m.margen_medio_real.toFixed(1)} puntos</b>, contra una incertidumbre semanal de{" "}
          <b>±{m.sigma.toFixed(0)}</b>: los partidos se deciden dentro del margen de error. Por eso
          el modelo nunca dio a nadie más de{" "}
          <b>{Math.round(Math.max(...m.por_gw.flatMap((g) => g.matchups.map((x) => Math.max(x.by_model.ENS.p_a, 1 - x.by_model.ENS.p_a)))) * 100)}%</b>{" "}
          de probabilidad. Una semana de H2H es, en buena medida, una moneda al aire; lo que se
          acumula es el roster.
        </div>
      </section>

      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Marcador por <span className="g">fuente</span></h2>
            <p className="kicker">
              Cuatro pronósticos independientes sobre los mismos rosters, con los mismos códigos
              que las tarjetas de la portada. <b>ENS</b> es el ensamble de la casa; las otras tres
              son fuentes externas y su identidad no se publica.
            </p>
          </div>
        </div>
        <div className="panel"><div className="tablewrap"><table className="modt">
          <thead><tr>
            <th className="l">Fuente</th>
            <th title="Error absoluto medio del puntaje de un equipo">Error medio</th>
            <th title="Error medio con signo: positivo = pronostica de más">Sesgo</th>
            <th title="Error absoluto medio en la diferencia del cruce">Error del margen</th>
            <th title="Cruces en los que señaló al ganador">Favorito OK</th>
            <th title="Calidad de la probabilidad: 0 es perfecto, 0.25 es una moneda">Brier</th>
          </tr></thead>
          <tbody>
            {m.models.map((mo) => {
              const r = m.resumen[mo];
              return (
                <tr key={mo} className={mo === "ENS" ? "ensrow" : ""}>
                  <td className="l">
                    <span className="mdot" style={{ background: MCOLOR[mo] }} />
                    <b>{MLABEL[mo] ?? mo}</b>
                    {mo === "ENS" && <span className="mtag">la casa</span>}
                    {best !== null && mo === best && <span className="newchip">mejor</span>}
                  </td>
                  <td>{r.mae.toFixed(1)}</td>
                  <td>{r.bias > 0 ? "+" : ""}{r.bias.toFixed(1)}</td>
                  <td>{r.mae_margen.toFixed(1)}</td>
                  <td className={r.acc > 0.5 ? "win" : r.acc < 0.5 ? "los" : ""}>{r.h2h}/{r.n_h2h}</td>
                  <td>{r.brier.toFixed(3)}</td>
                </tr>
              );
            })}
            <tr className="naiverow">
              <td className="l"><span className="mdot" style={{ background: "rgba(255,255,255,.3)" }} /><b>Control</b></td>
              <td>{m.naive.mae.toFixed(1)}</td><td>0.0</td><td>—</td><td>—</td><td>{m.naive.brier.toFixed(3)}</td>
            </tr>
          </tbody>
        </table></div></div>
        <p className="legendnote">
          <b>Control</b> = darle a todos el promedio real de esa jornada. Gana en error medio, y es
          esperable: un pronóstico es un valor esperado, así que comprime los extremos por
          construcción — nunca va a predecir el 54 ni el 28. Además hace trampa, porque ese promedio
          solo se conoce cuando la jornada ya terminó. Sirve como vara, no como rival.
          {" "}Con {ens.n_h2h} cruces medidos, ninguna diferencia entre fuentes es todavía
          concluyente.
        </p>
      </section>

      <section className="block">
        <div className="secthead">
          <div>
            <h2 className="h2">Pronosticado vs <span className="g">real</span></h2>
            <p className="kicker">Cada punto es un equipo en una jornada. La diagonal sería el acierto perfecto.</p>
          </div>
          <div className="seg">
            {m.models.map((mo) => (
              <button key={mo} className={model === mo ? "on" : ""} onClick={() => setModel(mo)}>
                {MLABEL[mo] ?? mo}
              </button>
            ))}
          </div>
        </div>
        <div className="panel" style={{ padding: 18 }}><Scatter m={m} model={model} /></div>
        <p className="legendnote">
          Puntos por encima de la diagonal = el equipo rindió más de lo pronosticado; por debajo,
          menos. La nube es estrecha en el eje horizontal justamente por lo anterior: el modelo
          reparte a casi todos entre 36 y 48, y la realidad se abre mucho más.
        </p>
      </section>

      {m.por_gw.map((g) => (
        <section className="block" key={g.gw}>
          <h2 className="h2">Jornada <span className="g">{g.gw}</span> · cruce por cruce</h2>
          <p className="kicker">
            Promedio real de la liga {g.media_real.toFixed(1)} pts · el Ensamble había dicho{" "}
            {(g.media_pred.ENS ?? 0).toFixed(1)}.
          </p>
          <div className="modgrid">
            {g.matchups.map((x: ModeloMatchup, k: number) => {
              const A = meta[x.a]; const B = meta[x.b];
              if (!A || !B) return null;
              const aWon = x.ra > x.rb;
              return (
                <div className="panel modcard" key={k}>
                  <div className="modhead">
                    <div className="ms">
                      <Badge emblem={A.emblem} short={A.short} i={A.i} />
                      <span className="mn" style={aWon ? { color: "var(--mint)" } : undefined}>{A.name}</span>
                    </div>
                    <div className="msc">{x.ra} <span>–</span> {x.rb}</div>
                    <div className="ms r">
                      <span className="mn" style={!aWon ? { color: "var(--mint)" } : undefined}>{B.name}</span>
                      <Badge emblem={B.emblem} short={B.short} i={B.i} />
                    </div>
                  </div>
                  <div className="modrows">
                    {m.models.map((mo) => {
                      const bm = x.by_model[mo];
                      if (!bm) return null;
                      const favA = bm.p_a > 0.5;
                      const pct = Math.round((favA ? bm.p_a : 1 - bm.p_a) * 100);
                      return (
                        <div className="modrow" key={mo}>
                          <span className="mchip" style={{ borderColor: MCOLOR[mo], color: MCOLOR[mo] }}>
                            {MLABEL[mo] ?? mo}
                          </span>
                          <span className="pmu">{bm.mu_a.toFixed(1)}</span>
                          <span className="pmu r">{bm.mu_b.toFixed(1)}</span>
                          <span className="mfav">
                            fav: {favA ? A.short : B.short} {pct}%
                          </span>
                          <span className={`mhit ${bm.hit ? "ok" : "no"}`}>{bm.hit ? "acertó" : "falló"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="legendnote">
            Margen real de la jornada: {g.margenes.join(", ")} puntos. Con una incertidumbre de ±
            {m.sigma.toFixed(0)}, todos estos cruces eran, antes de rodar la pelota, esencialmente
            un volado.
          </p>
        </section>
      ))}
    </>
  );
}
