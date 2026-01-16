import type { MatchesJson, StandingsJson } from "./types";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return (await res.json()) as T;
}

const base = import.meta.env.BASE_URL; // "/" en local, "/1rfef-grup2/" a Pages

export const api = {
  standings: () => fetchJson<StandingsJson>(`${base}data/standings.json`),
  matches: () => fetchJson<MatchesJson>(`${base}data/matches.json`)
};
