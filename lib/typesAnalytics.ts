// Types for data/liga-747-analitica.json (schema liga-analitica.v1)
// Reusa el schema League de las ligas cerradas (por eso los componentes Resumen /
// Performance / Versus / Plantillas / Puntos sirven tal cual) y le suma el bloque
// `modelo`: acierto de las predicciones publicadas frente al resultado real.
import { League } from "@/lib/types";

export interface ModeloResumen {
  n_scores: number; n_h2h: number;
  mae: number; bias: number; mae_margen: number;
  h2h: number; acc: number; brier: number;
}
export interface ModeloSide { mu_a: number; mu_b: number; p_a: number; hit: boolean }
export interface ModeloMatchup {
  a: number; b: number; ra: number; rb: number; margen: number;
  by_model: Record<string, ModeloSide>;
}
export interface ModeloGw {
  gw: number; media_real: number; media_pred: Record<string, number>;
  margenes: number[]; matchups: ModeloMatchup[];
}
export interface ModeloScatter { gw: number; id: number; real: number; pred: Record<string, number> }
export interface Modelo {
  sigma: number; models: string[]; events: number[];
  resumen: Record<string, ModeloResumen>;
  naive: { mae: number; brier: number };
  margen_medio_real: number;
  por_gw: ModeloGw[];
  scatter: ModeloScatter[];
  notas: Record<string, string>;
}
export interface LigaAnalitica extends League {
  schema: string; generated_at: string; modelo?: Modelo;
}
