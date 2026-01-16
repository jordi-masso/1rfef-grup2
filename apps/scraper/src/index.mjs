import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// pugem 3 nivells: apps/scraper/src -> apps/scraper -> apps -> (arrel) i entrem a /data
const dataDir = join(__dirname, "..", "..", "..", "data");
mkdirSync(dataDir, { recursive: true });

const updatedAt = new Date().toISOString();

const standings = {
  updatedAt,
  group: "1RFEF 2025-2026 · Grup 2",
  table: [
    {
      pos: 1,
      teamId: "CEEUROPA",
      teamName: "CE Europa",
      pts: 42,
      mp: 20,
      w: 13,
      d: 3,
      l: 4,
      gf: 32,
      ga: 18,
      gd: 14
    },
    {
      pos: 2,
      teamId: "TEAM2",
      teamName: "Equip 2",
      pts: 40,
      mp: 20,
      w: 12,
      d: 4,
      l: 4,
      gf: 28,
      ga: 17,
      gd: 11
    },
    {
      pos: 3,
      teamId: "TEAM3",
      teamName: "Equip 3",
      pts: 35,
      mp: 20,
      w: 10,
      d: 5,
      l: 5,
      gf: 25,
      ga: 20,
      gd: 5
    }
  ]
};

const matches = {
  updatedAt,
  season: "2025-2026",
  group: "Grup 2",
  matchdays: [
    {
      matchday: 1,
      matches: [
        {
          matchId: "MD01-CEEUROPA-TEAM2",
          matchday: 1,
          homeTeamId: "CEEUROPA",
          awayTeamId: "TEAM2",
          homeName: "CE Europa",
          awayName: "Equip 2",
          status: "played",
          score: { home: 2, away: 1 }
        }
      ]
    },
    {
      matchday: 2,
      matches: [
        {
          matchId: "MD02-TEAM3-CEEUROPA",
          matchday: 2,
          homeTeamId: "TEAM3",
          awayTeamId: "CEEUROPA",
          homeName: "Equip 3",
          awayName: "CE Europa",
          status: "scheduled"
        },
        {
          matchId: "MD02-TEAM2-TEAM3",
          matchday: 2,
          homeTeamId: "TEAM2",
          awayTeamId: "TEAM3",
          homeName: "Equip 2",
          awayName: "Equip 3",
          status: "scheduled"
        }
      ]
    }
  ]
};

writeFileSync(
  join(dataDir, "standings.json"),
  JSON.stringify(standings, null, 2),
  "utf-8"
);

writeFileSync(
  join(dataDir, "matches.json"),
  JSON.stringify(matches, null, 2),
  "utf-8"
);

console.log("✅ Data generated in /data");
