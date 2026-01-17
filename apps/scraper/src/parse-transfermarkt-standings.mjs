import * as cheerio from "cheerio";

function toInt(x) {
  const s = String(x ?? "").replace(/\s+/g, " ").trim();
  if (!s) return 0;
  // agafa el primer enter que aparegui (robust per "1.", "#1", etc.)
  const m = s.match(/-?\d+/);
  return m ? Number(m[0]) : 0;
}

function slugify(x) {
  return String(x ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickStandingsTable($) {
  // Prioritat: taules típiques de Transfermarkt
  const preferred = $("table.items, table[class*='items']").toArray();
  if (preferred.length) return $(preferred[0]);

  // Fallback: taula amb moltes files
  const tables = $("table").toArray().map((el) => $(el));
  let best = null;
  let bestRows = 0;

  for (const $t of tables) {
    const rows = $t.find("tbody tr").filter((_, tr) => $(tr).find("td").length >= 8);
    if (rows.length > bestRows) {
      bestRows = rows.length;
      best = $t;
    }
  }
  return best;
}

export function parseTransfermarktStandings(html) {
  const $ = cheerio.load(html);

  const best = pickStandingsTable($);
  if (!best) throw new Error("Could not locate standings table in Transfermarkt HTML.");

  const table = [];

  best.find("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    const $tds = $tr.find("td");
    if ($tds.length < 8) return;

    // Posició: 1a columna
    const pos = toInt($tds.eq(0).text());
    if (!pos) return;

    // Equip: columna del nom (normalment la 2a)
    const $teamLink =
      $tr.find('a[href*="/startseite/verein/"]').first().length
        ? $tr.find('a[href*="/startseite/verein/"]').first()
        : $tr.find('a[href*="/verein/"]').first();

    const tdTexts = $tds.toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
    const teamName = (($teamLink.text() || tdTexts[2] || tdTexts[1] || "").replace(/\s+/g, " ")).trim();

    if (!teamName) return;

    // teamId del primer segment del path (slug)
    let teamId = slugify(teamName);
    const href = $teamLink.attr("href") || "";
    if (href) {
      const parts = href.split("/").filter(Boolean);
      if (parts[0]) teamId = slugify(parts[0]);
    }

    // Columnes típques:
    // 0 pos | 1 team | 2 mp | 3 w | 4 d | 5 l | 6 gf:ga | 7 gd | 8 pts
    // Però a vegades hi ha una columna extra (p.ex. "Spiele" és a eq(3)...).
    // Heurística: busca el camp gf:ga i a partir d'això dedueix índexos.

    const gfgaIndex = tdTexts.findIndex((t) =>
      /^\d+\s*:\s*\d+$/.test(String(t).replace(/\u00a0/g, " ").trim())
    );
    if (gfgaIndex === -1) return;

    const gfga = String(tdTexts[gfgaIndex]).replace(/\u00a0/g, " ").trim();
    const [gf, ga] = gfga.split(":").map((n) => toInt(n));

    const gd = gf - ga;

    const mp = toInt(tdTexts[gfgaIndex - 4]); // mp,w,d,l immediatament abans de gf:ga
    const w = toInt(tdTexts[gfgaIndex - 3]);
    const d = toInt(tdTexts[gfgaIndex - 2]);
    const l = toInt(tdTexts[gfgaIndex - 1]);

    const pts = toInt(tdTexts[gfgaIndex + 2] ?? tdTexts[tdTexts.length - 1]); // sovint a 2 posicions després
    if (!mp) return;

    table.push({ pos, teamId, teamName, pts, mp, w, d, l, gf, ga, gd });
  });

  table.sort((a, b) => a.pos - b.pos);

  return {
    updatedAt: new Date().toISOString(),
    group: "1RFEF 2025-2026 · Grup 2",
    table,
  };
}