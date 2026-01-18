import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";

const html = readFileSync("data/_debug/transfermarkt-fixtures.html", "utf8");
const $ = cheerio.load(html);

const hits = [];
$("tr").each((i, tr) => {
  const $tr = $(tr);
  const t = $tr.text().replace(/\s+/g, " ").trim();
  if (t.includes("Sabadell") && (t.includes("Teruel"))) {
    // agafa els td “nets” per veure què hi ha realment
    const tds = $tr.find("td").toArray().map(td => $(td).text().replace(/\s+/g, " ").trim());
    const res = $tr.find("a.ergebnis-link").first();
    hits.push({
      i,
      tds,
      resText: res.text().replace(/\s+/g, " ").trim() || null,
      resId: res.attr("id") || null,
      classes: $tr.attr("class") || ""
    });
  }
});

console.log("HITS:", hits.length);
hits.slice(0, 20).forEach(h => {
  console.log("\n--- TR index", h.i, "classes:", h.classes);
  console.log("tds:", h.tds);
  console.log("ergebnis:", h.resText, "id:", h.resId);
});