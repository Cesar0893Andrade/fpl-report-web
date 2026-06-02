export interface Team {
  rank: number; id: number; name: string; short: string; manager: string;
  played: number; won: number; drawn: number; lost: number;
  pf: number; pa: number; pts: number; eff: number; emblem: string | null;
  avg_rank: number;
}
export interface SeriesItem { name: string; short: string; rank: number[] }
export interface PerfRow {
  id: number; name: string; short: string; manager: string; emblem: string | null;
  points: number[]; total: number; last5: number; last10: number;
  results: string[]; ranks: number[]; avg_rank: number; firsts: number;
  last5_rank: number; last10_rank: number;
}
export interface VersusRec { w: number; d: number; l: number }
export interface Versus { ids: number[]; rec: Record<string, Record<string, VersusRec>> }
export interface PlayerPts { el: number; name: string; pos: string; sq: number; xi: number; gp: number; gpx: number }
export interface PtsAgg { total: number; pos: Record<string, number>; type: Record<string, number> }
export interface TeamPts { id: number; squad: PtsAgg; xi: PtsAgg; players: PlayerPts[] }
export interface Points { tcols: string[]; teams: TeamPts[] }
export interface RosterPlayer { el: number; name: string; pos: string }
export interface Move { event: number; time: string; type: string; lentry: number; inEl: number; inName: string; inPos: string; outEl: number; outName: string; outPos: string }
export interface Rosters { draft: Record<string, RosterPlayer[]>; moves: Move[] }
export interface CopaTeam { id: number; seed: number; name: string; short: string; emblem: string | null }
export interface CopaGw { gw: number; a: number; b: number; w: string }
export interface CopaSeries { m: number; a: CopaTeam; b: CopaTeam; gws: CopaGw[]; winsA: number; winsB: number; ptsA: number; ptsB: number; winner: number; why: string }
export interface CopaRound { name: string; tag: string; gws: number[]; series: CopaSeries[] }
export interface Copa { name: string; seedEvent: number; seeds: CopaTeam[]; rounds: CopaRound[]; champion: CopaTeam }
export interface League {
  season: string;
  league: { id: number; name: string; division: string; teams: number; last_event: number };
  standings: Team[];
  progression: { events: number[]; series: SeriesItem[] };
  performance: { events: number[]; rows: PerfRow[] };
  versus: Versus;
  rosters: Rosters;
  points: Points;
  copa?: Copa;
}
