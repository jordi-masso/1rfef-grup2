import type { MatchesJson, StandingsJson } from "./types";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  standings: () => fetchJson<StandingsJson>("/data/standings.json"),
  matches: () => fetchJson<MatchesJson>("/data/matches.json")
};
