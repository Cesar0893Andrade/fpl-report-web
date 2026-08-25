"use client";
import { useEffect, useMemo, useState } from "react";
import { GameLive } from "@/lib/typesLive";

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIA = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

// Hora de Ecuador (UTC-5, sin horario de verano). Se formatea con un offset fijo en vez
// de la zona del navegador para que el servidor y el cliente rindan exactamente lo mismo.
function fmtEC(iso: string) {
  const t = new Date(new Date(iso).getTime() - 5 * 3600 * 1000);
  const hh = String(t.getUTCHours()).padStart(2, "0");
  const mm = String(t.getUTCMinutes()).padStart(2, "0");
  return `${DIA[t.getUTCDay()]} ${t.getUTCDate()}-${MES[t.getUTCMonth()]} · ${hh}:${mm}`;
}

type Hito = { k: string; t: string; iso: string; nota: string };

export default function GameClock({ g }: { g: GameLive }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const hitos = useMemo<Hito[]>(() => {
    const ev = g.next_event;
    const out: Hito[] = [];
    if (g.next_trades_utc)
      out.push({
        k: "trades", t: "Cierre de trades", iso: g.next_trades_utc,
        nota: "Ultimo momento para proponer o responder un intercambio entre equipos.",
      });
    if (g.next_waivers_utc)
      out.push({
        k: "waivers", t: "Corrida de waivers", iso: g.next_waivers_utc,
        nota: "Se resuelven las pujas por orden de prioridad. Despues de esto, el mercado queda en free agency: primero que llega, se lo lleva.",
      });
    if (g.next_deadline_utc)
      out.push({
        k: "deadline", t: `Deadline Jornada ${ev ?? ""}`.trim(), iso: g.next_deadline_utc,
        nota: "Se congelan las alineaciones. Lo que este en la banca, se queda en la banca.",
      });
    return out;
  }, [g]);

  if (!hitos.length) return null;

  const pend = now === null ? hitos[0] : hitos.find((h) => new Date(h.iso).getTime() > now);
  const remaining = now === null || !pend ? null : new Date(pend.iso).getTime() - now;
  const cd = remaining !== null && remaining > 0
    ? {
        dd: Math.floor(remaining / 86400000),
        hh: Math.floor((remaining % 86400000) / 3600000),
        mm: Math.floor((remaining % 3600000) / 60000),
      }
    : null;

  const stateOf = (h: Hito) => {
    if (now === null) return "";
    if (new Date(h.iso).getTime() <= now) return "done";
    return pend && h.k === pend.k ? "now" : "";
  };

  return (
    <>
      <div className="cdpanel reveal">
        <div>
          <div className="cdlabel">{pend ? "Siguiente hito" : "Jornada en curso"}</div>
          <div className="cdmeta">
            {pend ? `${pend.t} · ${fmtEC(pend.iso)} (Ecuador)` : "Ya no se pueden mover fichas."}
          </div>
        </div>
        {pend ? (
          <div className="cdunits">
            <div className="cdu"><b>{cd ? cd.dd : "--"}</b><span>dias</span></div>
            <div className="cdu"><b>{cd ? String(cd.hh).padStart(2, "0") : "--"}</b><span>horas</span></div>
            <div className="cdu"><b>{cd ? String(cd.mm).padStart(2, "0") : "--"}</b><span>min</span></div>
          </div>
        ) : (
          <div className="cddone">En juego</div>
        )}
      </div>

      <div className="gcstrip">
        {hitos.map((h) => {
          const st = stateOf(h);
          return (
            <div className={`gcitem ${st}`} key={h.k}>
              <div className="gct">
                {h.t}
                {st === "done" && <span className="gcflag">listo</span>}
                {st === "now" && <span className="gcflag next">siguiente</span>}
              </div>
              <div className="gcw">{fmtEC(h.iso)}</div>
              <div className="gcn">{h.nota}</div>
            </div>
          );
        })}
      </div>

      <p className="footnote">
        Horas de Ecuador, tomadas del calendario oficial del juego.{" "}
        {g.waivers_processed
          ? "Los waivers de esta jornada ya se procesaron."
          : "Los waivers de esta jornada todavia no se procesan."}
      </p>
    </>
  );
}
