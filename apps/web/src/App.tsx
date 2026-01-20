import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./api";
import type { MatchesJson, StandingsJson } from "./types";

type PredictionMap = Record<string, { home: string; away: string }>;

const STORAGE_KEY = "predictions:v1";
const FOCUS_TEAM_ID = "ce-europa";

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 1px 0 rgba(0,0,0,0.02)"
};

function positionColor(pos: number) {
  if (pos === 1) return "#c7ead1";      // verd una mica més fosc (ascens directe)
  if (pos >= 2 && pos <= 5) return "#e6f4ea"; // verd actual (play-off)
  if (pos >= 16) return "#fdeaea";      // vermell (descens)
  return "#f7f7f7";                // resta
}

function loadPredictions(): PredictionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PredictionMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function savePredictions(p: PredictionMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function StandingsLegend() {
  const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13
  };

  const box = (color: string) => ({
    width: 14,
    height: 14,
    borderRadius: 4,
    background: color,
    border: "1px solid #ccc"
  });

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
      <div style={itemStyle}>
        <span style={box(positionColor(1))} />
        Ascens directe
      </div>
      <div style={itemStyle}>
        <span style={box(positionColor(2))} />
        Play-off (2–5)
      </div>
      <div style={itemStyle}>
        <span style={box(positionColor(16))} />
        Descens (16–20)
      </div>
    </div>
  );
}

export default function App() {
  const [standings, setStandings] = useState<StandingsJson | null>(null);
  const [matches, setMatches] = useState<MatchesJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const [predictions, setPredictions] = useState<PredictionMap>(() => loadPredictions());
  const [computedTable, setComputedTable] = useState<StandingsJson | null>(null);
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 900);
  const [mobileTab, setMobileTab] = useState<"matches" | "standings">("matches");

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([api.standings(), api.matches()]);
        setStandings(s);
        setMatches(m);
        const firstWithPending = m.matchdays.find((md) => md.matches.some((x) => x.status !== "played"))?.matchday;
        setSelectedMatchday(firstWithPending ?? m.matchdays[0]?.matchday ?? 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const currentMatchday = useMemo(() => {
    if (!matches) return null;
    return matches.matchdays.find((md) => md.matchday === selectedMatchday) ?? null;
  }, [matches, selectedMatchday]);

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <h1>1RFEF Grup 2</h1>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  if (!standings || !matches) {
    return (
      <div style={{ padding: 16 }}>
        <h1>1RFEF Grup 2</h1>
        <p>Carregant dades…</p>
      </div>
    );
  }

  const displayedStandings = computedTable ?? standings;

  function matchdayPlayedInfo(md: MatchesJson["matchdays"][number]) {
    const total = md.matches.length;
    const played = md.matches.filter((m) => m.status === "played").length;
    return { total, played };
  }

  function matchdayHasPredictions(md: MatchesJson["matchdays"][number]) {
    return md.matches.some((m) => {
      if (m.status !== "scheduled") return false;
      const p = predictions[m.matchId];
      const home = (p?.home ?? "").trim();
      const away = (p?.away ?? "").trim();
      return home !== "" || away !== "";
    });
  }

  function matchdayMarker(md: MatchesJson["matchdays"][number]) {
    const { total, played } = matchdayPlayedInfo(md);
    const hasPred = matchdayHasPredictions(md);

    if (total > 0 && played === total) {
      return { color: "#e6f4ea", title: "Jornada completada" }; // verd
    }

    if (played > 0 && played < total) {
      return { color: "#fff1db", title: "Jornada en curs" }; // taronja (preval)
    }

    if (hasPred) {
      return { color: "#fff1db", title: "Hi ha pronòstics" }; // groc
    }

    return null;
  }

  const standingsSection = (
    <section style={{ marginTop: isNarrow ? 18 : 0, minWidth: 0, ...cardStyle }}>
      <h2 style={{ marginBottom: 4 }}>Classificació</h2>
      <StandingsLegend />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
              {[
                { label: "Pos", align: "center" },
                { label: "Equip", align: "center" },
                { label: "Pts", align: "right" },
                { label: "PJ", align: "right" },
                { label: "G", align: "right" },
                { label: "E", align: "right" },
                { label: "P", align: "right" },
                { label: "GF", align: "right" },
                { label: "GA", align: "right" },
                { label: "DG", align: "right" },
              ].map((c) => (
                <th
                  key={c.label}
                  style={{
                    padding: 8,
                    textAlign: c.align as any,
                    background: "#fafafa",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedStandings.table.map((r) => {
              const isFocus = r.teamId === FOCUS_TEAM_ID;

              return (
                <tr
                  key={r.teamId}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: isFocus ? "#fff7d6" : "transparent",
                    fontWeight: isFocus ? 700 : 400,
                  }}
                >
                  <td
                    style={{
                      padding: 8,
                      textAlign: "center",
                      background: positionColor(r.pos),
                      fontWeight: 700,
                      borderRadius: 6,
                    }}
                  >
                    {r.pos}
                  </td>
                  <td style={{ padding: 8, minWidth: 220 }}>{r.teamName}</td>
                  <td style={{ padding: 8, textAlign: "right", fontWeight: 800 }}>{r.pts}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.mp}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.w}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.d}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.l}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.gf}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.ga}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{r.gd}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  const matchesSection = (
    <section style={{ marginTop: isNarrow ? 18 : 0, minWidth: 0, ...cardStyle }}>
      {/* Fila 1: títol + botons */}
      <div      >
        <h2 style={{ margin: 0, textAlign: "center" }}>Jornada {selectedMatchday}</h2>
      </div>

      {/* Fila 2: grid de jornades */}
      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(36px, 1fr))",
            gap: 6,
            alignItems: "center",
            width: "100%",
            maxWidth: 620,
          }}
        >
          {matches.matchdays.map((md) => {
            const active = md.matchday === selectedMatchday;
            const marker = matchdayMarker(md);
            const bgColor = marker?.color ?? "white";

            return (
              <button
                key={md.matchday}
                type="button"
                onClick={() => setSelectedMatchday(md.matchday)}
                style={{
                  padding: "6px 0",
                  borderRadius: 10,
                  border: active ? "2px solid #333" : "1px solid #ddd",
                  background: bgColor,
                  cursor: "pointer",
                  fontWeight: active ? 800 : 600,
                  opacity: active ? 1 : 0.9,
                  transition: "background 120ms ease, border 120ms ease",
                }}
                aria-pressed={active}
                title={marker?.title ?? `Jornada ${md.matchday}`}
              >
                {md.matchday}
              </button>
            );
          })}
        </div>
      </div>

      {!currentMatchday ? (
        <p>No hi ha dades d’aquesta jornada.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {currentMatchday.matches.map((m) => (

            <li
              key={m.matchId}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(140px, 1fr) 110px minmax(140px, 1fr)",
                gap: 10,
                alignItems: "center",
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 12,
                marginBottom: 10,
                columnGap: 18,
              }}
            >
              <div
                style={{
                  textAlign: "right",
                  fontWeight: m.homeTeamId === FOCUS_TEAM_ID ? 700 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                title={m.homeName}
              >
                {m.homeName}
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                {m.status === "played" && m.score ? (
                  <div
                    style={{
                      width: 120,
                      textAlign: "center",
                      fontWeight: 800,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#f6f6f6"
                    }}
                  >
                    {m.score.home} - {m.score.away}
                  </div>
                ) : (
                  <div style={{ width: 120, display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      style={{ width: 40, textAlign: "center" }}
                      value={predictions[m.matchId]?.home ?? ""}
                      onChange={(e) =>
                        updatePrediction(m.matchId, "home", e.target.value.replace(/\D/g, ""))
                      }
                    />
                    <span style={{ opacity: 0.7, fontWeight: 700 }}>-</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      style={{ width: 40, textAlign: "center" }}
                      value={predictions[m.matchId]?.away ?? ""}
                      onChange={(e) =>
                        updatePrediction(m.matchId, "away", e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  textAlign: "left",
                  fontWeight: m.awayTeamId === FOCUS_TEAM_ID ? 700 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                title={m.awayName}
              >
                {m.awayName}
              </div>

            </li>
          ))}

          <div style={{ display: "flex", gap: 8, alignItems: "center", justifySelf: "end" }}>
            <button
              type="button"
              onClick={calculateStandings}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
              }}
            >
              Calcular
            </button>

            <button
              type="button"
              onClick={clearPredictions}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reiniciar
            </button>
          </div>
        </ul>
      )}
    </section>
  );

  return (
    <div style={{ padding: 16, margin: "0 auto", background: "#fafafa", borderRadius: 16 }}>
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Esquerra (pot quedar buit o amb el badge si vols) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {computedTable ? (
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: "#f6f6f6",
              }}
            >
              Mode simulació
            </span>
          ) : null}
        </div>

        {/* Centre (títol centrat de veritat) */}
        <h1 style={{ margin: 0, textAlign: "center" }}>1RFEF Grup 2</h1>

        {/* Dreta */}
        <small style={{ opacity: 0.7, justifySelf: "end" }}>
          Actualitzat: {new Date(displayedStandings.updatedAt).toLocaleString()}
        </small>
      </header>

      {isNarrow ? (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              type="button"
              onClick={() => setMobileTab("matches")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: mobileTab === "matches" ? "#f6f6f6" : "white",
                cursor: "pointer",
                fontWeight: mobileTab === "matches" ? 700 : 400,
                flex: 1,
              }}
            >
              Jornades
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("standings")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: mobileTab === "standings" ? "#f6f6f6" : "white",
                cursor: "pointer",
                fontWeight: mobileTab === "standings" ? 700 : 400,
                flex: 1,
              }}
            >
              Classificació
            </button>
          </div>

          {mobileTab === "matches" ? matchesSection : standingsSection}
        </>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 18,
            marginTop: 18,
            alignItems: "start",
          }}
        >
          {matchesSection}
          {standingsSection}
        </div>
      )}
    </div>
  );

  function updatePrediction(matchId: string, side: "home" | "away", value: string) {
    setPredictions((prev) => {
      const next = {
        ...prev,
        [matchId]: {
          home: prev[matchId]?.home ?? "",
          away: prev[matchId]?.away ?? "",
          [side]: value
        }
      };
      savePredictions(next);
      return next;
    });
  }

  function clearPredictions() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setPredictions({});
    setComputedTable(null);
  }

  function calculateStandings() {
    if (!standings || !matches) return;

    // 1) clonar files base
    const rows = standings.table.map((r) => ({ ...r }));

    // index per teamId
    const byTeam: Record<string, (typeof rows)[number]> = {};
    for (const r of rows) byTeam[r.teamId] = r;

    // guardar posició original per desempats de fallback
    const originalPos: Record<string, number> = {};
    for (const r of standings.table) originalPos[r.teamId] = r.pos;

    // 2) aplicar pronòstics als scheduled
    for (const md of matches.matchdays) {
      for (const m of md.matches) {
        if (m.status !== "scheduled") continue;

        const pred = predictions[m.matchId];
        const home = toInt(pred?.home);
        const away = toInt(pred?.away);

        // només si hi ha marcador complet
        if (home === null || away === null) continue;

        const homeRow = byTeam[m.homeTeamId];
        const awayRow = byTeam[m.awayTeamId];

        // si algun equip no existeix a la taula (dummy), saltem
        if (!homeRow || !awayRow) continue;

        // sumar partit
        homeRow.mp += 1;
        awayRow.mp += 1;

        homeRow.gf += home;
        homeRow.ga += away;

        awayRow.gf += away;
        awayRow.ga += home;

        homeRow.gd = homeRow.gf - homeRow.ga;
        awayRow.gd = awayRow.gf - awayRow.ga;

        // punts i W/D/L
        if (home > away) {
          homeRow.w += 1;
          awayRow.l += 1;
          homeRow.pts += 3;
        } else if (home < away) {
          awayRow.w += 1;
          homeRow.l += 1;
          awayRow.pts += 3;
        } else {
          homeRow.d += 1;
          awayRow.d += 1;
          homeRow.pts += 1;
          awayRow.pts += 1;
        }
      }
    }

    // 3) ordenar i recalcular pos
    rows.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (originalPos[a.teamId] ?? 999) - (originalPos[b.teamId] ?? 999);
    });

    const tableWithPos = rows.map((r, i) => ({ ...r, pos: i + 1 }));

    setComputedTable({
      ...standings,
      updatedAt: new Date().toISOString(),
      table: tableWithPos
    });
  }


  function toInt(s: string | undefined): number | null {
    if (s == null || s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
}
