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
export interface League {
  season: string;
  league: { id: number; name: string; division: string; teams: number; last_event: number };
  standings: Team[];
  progression: { events: number[]; series: SeriesItem[] };
  performance: { events: number[]; rows: PerfRow[] };
}
