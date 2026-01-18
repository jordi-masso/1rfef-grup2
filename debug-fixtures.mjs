import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";

const html = readFileSync("data/_debug/transfermarkt-fixtures.html", "utf8");
const $ = cheerio.load(html);

const rows = $("tr").toArray().map((r) => $(r));

const hit = rows.find(($tr) => {
  const t = $tr.text();
  return t.includes("CE Europa") && (
    t.includes("Atl. Madrileño") ||
    t.includes("Atlético") ||
    t.includes("Atletico") ||
    t.includes("Atl. Madrid")
  );
});

if (!hit) {
  console.log("NOT FOUND");
  process.exit(0);
}

const tds = hit.find("td").toArray().map((td) =>
  $(td).text().replace(/\s+/g, " ").trim()
);

const res = hit.find("a.ergebnis-link").first();

console.log("TDs:", tds);
console.log("ergebnis-link text:", res.text().replace(/\s+/g, " ").trim());
console.log("ergebnis-link id:", res.attr("id") || null);