import * as cheerio from "cheerio";

function toInt(x) {
    const s = String(x ?? "").replace(/\s+/g, " ").trim();
    if (!s) return 0;
    // permet +6, -1
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
}

function slugify(name) {
    return String(name ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function parseBeSoccerStandings(html) {
    const $ = cheerio.load(html);

    // IMPORTANT: només la pestanya "Total"
    const rows = $("#tab_total0 table.table tr.row-body").toArray().map((el) => $(el));

    if (rows.length === 0) {
        throw new Error("No standings rows found: selector #tab_total0 table.table tr.row-body returned 0 rows.");
    }

    const table = rows.map(($r) => {
        const pos = toInt($r.find("td.number-box div").first().text());
        const teamName = $r.find("td.name .team-name").first().text().trim();

        const teamHref = $r.find('td.name a[data-cy="team"]').attr("href") || "";
        // ex: https://www.besoccer.com/team/ce-europa  -> ce-europa
        const teamId = teamHref ? slugify(teamHref.split("/").filter(Boolean).pop()) : slugify(teamName);

        // columnes numèriques a partir dels td després del "name"
        // markup: td.number-box, td.td-shield, td.name, td(PTS), td(MP), td(W), td(D), td(L), td(GF), td(GA), td(GD)
        const tds = $r.find("td").toArray().map((el) => $(el));

        // PTS és td index 3
        const pts = toInt(tds[3]?.text());
        const mp = toInt(tds[4]?.text());
        const w = toInt(tds[5]?.text());
        const d = toInt(tds[6]?.text());
        const l = toInt(tds[7]?.text());
        const gf = toInt(tds[8]?.text());
        const ga = toInt(tds[9]?.text());
        const gd = toInt(tds[10]?.text());

        return { pos, teamId, teamName, pts, mp, w, d, l, gf, ga, gd };
    });

    // ordena per pos per si el DOM ve en ordre estrany
    table.sort((a, b) => a.pos - b.pos);

    return {
        updatedAt: new Date().toISOString(),
        group: "1RFEF 2025-2026 · Grup 2",
        table
    };
}