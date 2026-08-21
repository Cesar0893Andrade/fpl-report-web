// Types for data/liga-747.json (schema liga-live.v1)

export interface LeagueInfoLive {
  id: number; name: string; teams: number; scoring: string;
  draft_dt_utc: string; draft_local: string;
}
export interface TeamLive {
  lentry: number; entry: number; name: string; short: string;
  manager: string; emblem: string; nuevo: boolean;
}
export interface StandingLive {
  rank: number; lentry: number; played: number; won: number; drawn: number;
  lost: number; pf: number; pa: number; pts: number;
}
export interface GwMatch { a: number; b: number; pa: number; pb: number; started: boolean; finished: boolean }
export interface GwLive { event: number; matches: GwMatch[] }
export interface DraftPick {
  pick: number; round: number; lentry: number; el: number;
  name: string; pos: string; club: string; auto: boolean;
}
export interface DraftLive { rounds: number; picks: DraftPick[] }
export interface EmbargoPlayer {
  el: number; code: number; name: string; web: string;
  club: string; pos: string; added_utc: string;
}
export interface EmbargoLive {
  unlock_gw: number; unlock_utc: string; unlock_local: string;
  market_close_utc: string; baseline_elements: number; players: EmbargoPlayer[];
}
export interface LeagueLive {
  schema: string; generated_at: string; season: string;
  league: LeagueInfoLive; teams: TeamLive[]; standings: StandingLive[];
  gw: GwLive; draft: DraftLive; embargo: EmbargoLive;
}

// Types for data/predicciones-747.json (schema predicciones-gw.v1)
// Team-level totals only; model sources are masked codes (ENS/FPLR/SL/TA).
export interface PredSide {
  mu_a: number; mu_b: number; form_a: string; form_b: string; p_a: number;
  cov_a?: number; cov_b?: number;
}
export interface PredMatchup { a: number; b: number; by_model: Record<string, PredSide> }
export interface PredGw { generated_at: string; projection_version_gw: number; matchups: PredMatchup[] }
export interface PredTeam { lentry: number; entry: number; name: string; short: string }
export interface Predicciones {
  schema: string; season: string; league_id: number; sigma: number;
  models: string[]; notas: Record<string, string>;
  teams: PredTeam[]; gws: Record<string, PredGw>;
}
