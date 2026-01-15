export type StandingRow = {
  pos: number;
  teamId: string;
  teamName: string;
  pts: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
};

export type StandingsJson = {
  updatedAt: string;
  group: string;
  table: StandingRow[];
};

export type MatchScore = { home: number; away: number };

export type Match = {
  matchId: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  status: "played" | "scheduled";
  score?: MatchScore;
};

export type Matchday = {
  matchday: number;
  matches: Match[];
};

export type MatchesJson = {
  updatedAt: string;
  season: string;
  group: string;
  matchdays: Matchday[];
};
