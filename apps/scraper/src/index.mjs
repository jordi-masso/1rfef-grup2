import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./fetch.mjs";
import { parseBeSoccerStandings } from "./parse-besoccer-standings.mjs";
import { parseTransfermarktMatches } from "./parse-transfermarkt-matches.mjs";
import { parseTransfermarktStandings } from "./parse-transfermarkt-standings.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// arrel del repo: apps/scraper/src -> apps/scraper -> apps -> (root)
const repoRoot = join(__dirname, "..", "..", "..");
const outDir = join(repoRoot, "data");
const debugDir = join(outDir, "_debug");

mkdirSync(debugDir, { recursive: true });

const URLS = {
  standings: "https://www.besoccer.com/competition/table/primera_division_rfef/2026/group2",
  fixtures: "https://www.transfermarkt.com/primera-rfef-footters-grupo-ii/gesamtspielplan/wettbewerb/E3G2",
  standingsTm: "https://www.transfermarkt.com/primera-rfef-footters-grupo-ii/tabelle/wettbewerb/E3G2",
};

const updatedAt = new Date().toISOString();

async function main() {
  // 1) Baixa i guarda snapshots

  const isCI = process.env.CI === "true";

  let standingsJson;

  if (isCI) {
    console.log("ℹ️ CI detected: skipping BeSoccer (often returns 406)");
    const standingsHtmlTm = await fetchText(URLS.standingsTm, {
      cachePath: join(debugDir, "transfermarkt-standings.html")
    });
    standingsJson = parseTransfermarktStandings(standingsHtmlTm);
    console.log("✅ standings from Transfermarkt");
  } else {
    try {
      const standingsHtml = await fetchText(URLS.standings, {
        cachePath: join(debugDir, "besoccer-standings.html")
      });
      standingsJson = parseBeSoccerStandings(standingsHtml);
      console.log("✅ standings from BeSoccer");
    } catch (e) {
      console.warn("⚠️ BeSoccer standings failed, falling back to Transfermarkt:", e.message);
      const standingsHtmlTm = await fetchText(URLS.standingsTm, {
        cachePath: join(debugDir, "transfermarkt-standings.html")
      });
      standingsJson = parseTransfermarktStandings(standingsHtmlTm);
      console.log("✅ standings from Transfermarkt");
    }
  }

  writeFileSync(join(outDir, "standings.json"), JSON.stringify(standingsJson, null, 2), "utf-8");


  const fixturesHtml = await fetchText(URLS.fixtures, {
    cachePath: join(debugDir, "transfermarkt-fixtures.html")
  });

  const matchesJson = parseTransfermarktMatches(fixturesHtml);
  writeFileSync(join(outDir, "matches.json"), JSON.stringify(matchesJson, null, 2), "utf-8");
  console.log("✅ matches.json generated");

  // 2) Metadata mínima (per verificar que el job corre)
  const meta = {
    updatedAt,
    sources: URLS,
    sizes: {
      standingsHtml: standingsJson.table.length,
      fixturesHtml: fixturesHtml.length
    }
  };

  writeFileSync(join(debugDir, "meta.json"), JSON.stringify(meta, null, 2), "utf-8");
  console.log("✅ Snapshots saved to data/_debug");
}

main().catch((e) => {
  console.error("❌ Scraper failed:", e);
  process.exit(1);
});