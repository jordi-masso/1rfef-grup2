import * as cheerio from "cheerio";

function toInt(x) {
  const s = String(x ?? "").replace(/\s+/g, " ").trim();
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function slugify(x) {
  return String(x ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseTransfermarktStandings(html) {
  const $ = cheerio.load(html);

  // A Transfermarkt, la classificació acostuma a ser una "responsive-table" amb taula dins.
  // Fem heurística: agafem la primera taula gran que tingui moltes files i columnes típiques.
  const tables = $("table").toArray().map((el) => $(el));

  let best = null;
  let bestRows = 0;

  for (const $t of tables) {
    const rows = $t.find("tbody tr").filter((_, tr) => $(tr).find("td").length >= 6);
    if (rows.length > bestRows) {
      bestRows = rows.length;
      best = $t;
    }
  }

  if (!best || bestRows < 10) {
    throw new Error("Could not locate standings table in Transfermarkt HTML.");
  }

  const table = [];

  best.find("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    const $tds = $tr.find("td");
    if ($tds.length < 6) return;

    // La posició acostuma a ser primer td
    const pos = toInt($tds.eq(0).text());

    // Nom equip: sovint a un <a> amb /startseite/verein/<id>
    const $teamLink = $tr.find('a[href*="/startseite/verein/"], a[href*="/verein/"]').first();
    const teamName = ($teamLink.text() || $tds.eq(1).text()).replace(/\s+/g, " ").trim();

    let teamId = slugify(teamName);
    const href = $teamLink.attr("href") || "";
    if (href) {
      const parts = href.split("/").filter(Boolean);
      // sovint el slug és el primer segment
      if (parts[0]) teamId = slugify(parts[0]);
    }

    // Columnes típiques TM: MP/W/D/L/GF/GA/GD/Pts poden variar segons competició.
    // Estratègia: agafar tots els números dels td i mappejar:
    const nums = $tds
      .toArray()
      .map((el) => $(el).text().replace(/\s+/g, " ").trim())
      .map((t) => t.replace("\u00a0", ""))
      .filter((t) => t !== "" && /^[-+]?\d+$/.test(t) || /^[-+]?\d+:\d+$/.test(t));

    // Si ve amb GF:GA en un sol camp, ho separem
    let gf = 0, ga = 0;

    const gfga = $tr.find("td").toArray().map((el) => $(el).text().trim()).find((t) => /^\d+:\d+$/.test(t));
    if (gfga) {
      const [a, b] = gfga.split(":").map((n) => Number(n));
      gf = a; ga = b;
    }

    // Punts acostumen a ser últim número “fort”
    const pts = toInt(nums[nums.length - 1]);
    const mp = toInt(nums[0]);
    const w = toInt(nums[1]);
    const d = toInt(nums[2]);
    const l = toInt(nums[3]);

    const gd = gf || ga ? (gf - ga) : 0;

    if (!teamName || !pos) return;

    table.push({ pos, teamId, teamName, pts, mp, w, d, l, gf, ga, gd });
  });

  table.sort((a, b) => a.pos - b.pos);

  return {
    updatedAt: new Date().toISOString(),
    group: "1RFEF 2025-2026 · Grup 2",
    table
  };
}