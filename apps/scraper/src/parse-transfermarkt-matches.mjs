import * as cheerio from "cheerio";

function slugify(x) {
    return String(x ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function parseMatchdayNumber(headline) {
    const m = String(headline).match(/(\d+)\s*\./);
    return m ? Number(m[1]) : null;
}

function teamFromCell($td) {
    const $a = $td.find("a").first();
    const name = $a.text().replace(/\s+/g, " ").trim();

    const href = $a.attr("href") || "";
    const parts = href.split("/").filter(Boolean);
    const teamSlug = parts[0] ? slugify(parts[0]) : slugify(name);

    return { teamId: teamSlug, teamName: name, href };
}

function parseDateText(text) {
    // exemple: "Fri 29/08/25"
    const m = String(text).match(/(\d{2})\/(\d{2})\/(\d{2})/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yy = Number(m[3]);
    const year = 2000 + yy;
    const iso = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    return iso;
}

function parseScore(text) {
    const m = String(text).trim().match(/^(\d+)\s*:\s*(\d+)$/);
    if (!m) return null;
    return { home: Number(m[1]), away: Number(m[2]) };
}

export function parseTransfermarktMatches(html) {
    const $ = cheerio.load(html);

    const matchdays = [];

    const $heads = $('div.content-box-headline:contains("Matchday")');
    if ($heads.length === 0) {
        throw new Error('No matchday headlines found (selector div.content-box-headline:contains("Matchday") returned 0).');
    }

    $heads.each((_, el) => {
        const headlineText = $(el).text().trim();
        const matchday = parseMatchdayNumber(headlineText);
        if (!matchday) return;

        const $table = $(el).nextAll("table").first();
        const $rows = $table.find("tbody tr");

        const matches = [];

        $rows.each((__, tr) => {
            const $tr = $(tr);

            // ignora files "bg_blau_20" (blocs de data per mobil)
            if ($tr.hasClass("bg_blau_20")) return;

            const $homeCell = $tr.find("td.text-right.hauptlink").first();
            const $awayCell = $tr.find("td.no-border-links.hauptlink").last();

            if ($homeCell.length === 0 || $awayCell.length === 0) return;

            const home = teamFromCell($homeCell);
            const away = teamFromCell($awayCell);

            // data i hora (desktop)
            const dateCellText = $tr.find("td.hide-for-small").first().text().replace(/\s+/g, " ").trim();
            const timeText = $tr.find("td.zentriert.hide-for-small").first().text().replace(/\s+/g, " ").trim();

            const dateISO = parseDateText(dateCellText);

            // resultat
            const $resLink = $tr.find("a.ergebnis-link").first();
            const scoreText = $resLink.text().replace(/\s+/g, " ").trim();
            const score = parseScore(scoreText);

            const tmMatchId = $resLink.attr("id") || ""; // ex: 4650794
            const matchId =
                tmMatchId && /^\d+$/.test(tmMatchId)
                    ? `tm-${tmMatchId}`
                    : `MD${String(matchday).padStart(2, "0")}-${home.teamId}-${away.teamId}-${dateISO ?? "na"}`;

            const status = score ? "played" : "scheduled";

            const match = {
                matchId,
                matchday,
                date: dateISO,           // YYYY-MM-DD o null
                time: timeText || null,  // "9:30 PM" o null
                homeTeamId: home.teamId,
                awayTeamId: away.teamId,
                homeName: home.teamName,
                awayName: away.teamName,
                status
            };

            if (score) match.score = score;

            matches.push(match);
        });

        matchdays.push({ matchday, matches });
    });

    matchdays.sort((a, b) => a.matchday - b.matchday);

    return {
        updatedAt: new Date().toISOString(),
        competition: "Primera Federación - Grupo II",
        matchdays
    };
}
