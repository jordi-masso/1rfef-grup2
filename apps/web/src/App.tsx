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

export default function App() {
  const [standings, setStandings] = useState<StandingsJson | null>(null);
  const [matches, setMatches] = useState<MatchesJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const [predictions, setPredictions] = useState<PredictionMap>(() => loadPredictions());
  const [computedTable, setComputedTable] = useState<StandingsJson | null>(null);
  const [matchFilter, setMatchFilter] = useState<"all" | "played" | "scheduled">("all");
  const [onlyFocusTeam, setOnlyFocusTeam] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([api.standings(), api.matches()]);
        setStandings(s);
        setMatches(m);
        setSelectedMatchday(m.matchdays[0]?.matchday ?? 1);
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

  const matchCounts = useMemo(() => {
    if (!currentMatchday) return { all: 0, played: 0, scheduled: 0 };

    const filteredByTeam = currentMatchday.matches.filter((m) =>
      !onlyFocusTeam ? true : m.homeTeamId === FOCUS_TEAM_ID || m.awayTeamId === FOCUS_TEAM_ID
    );

    return {
      all: filteredByTeam.length,
      played: filteredByTeam.filter((m) => m.status === "played").length,
      scheduled: filteredByTeam.filter((m) => m.status === "scheduled").length
    };
  }, [currentMatchday, onlyFocusTeam]);


  if (!standings || !matches) {
    return (
      <div style={{ padding: 16 }}>
        <h1>1RFEF Grup 2</h1>
        <p>Carregant dades…</p>
      </div>
    );
  }

  const displayedStandings = computedTable ?? standings;

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto", background: "#fafafa", borderRadius: 16 }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0 }}>1RFEF Grup 2</h1>

          {computedTable ? (
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: "#f6f6f6"
              }}
            >
              Mode simulació
            </span>
          ) : null}
        </div>
        <small style={{ opacity: 0.7 }}>
          Actualitzat: {new Date(displayedStandings.updatedAt).toLocaleString()}
        </small>
      </header>

      <section style={{ marginTop: 18, ...cardStyle }}>
        <h2 style={{ marginBottom: 8 }}>Classificació</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr style={{ textAlign: "center", borderBottom: "1px solid #ddd", background: "#fafafa" }}>
                <th style={{ padding: 8 }}>Pos</th>
                <th style={{ padding: 8 }}>Equip</th>
                <th style={{ padding: 8, textAlign: "right" }}>Pts</th>
                <th style={{ padding: 8, textAlign: "right" }}>PJ</th>
                <th style={{ padding: 8, textAlign: "right" }}>G</th>
                <th style={{ padding: 8, textAlign: "right" }}>E</th>
                <th style={{ padding: 8, textAlign: "right" }}>P</th>
                <th style={{ padding: 8, textAlign: "right" }}>GF</th>
                <th style={{ padding: 8, textAlign: "right" }}>GA</th>
                <th style={{ padding: 8, textAlign: "right" }}>DG</th>
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
                      fontWeight: isFocus ? 700 : 400
                    }}
                  >
                    <td
                      style={{
                        padding: 8,
                        textAlign: "center",
                        background: positionColor(r.pos),
                        fontWeight: 700,
                        borderRadius: 6
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

      <section style={{ marginTop: 18, ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ marginBottom: 8 }}>Jornades</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10
            }}
          >
            {/* Esquerra: selector jornada */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ opacity: 0.7 }}>Jornada</span>
                <select
                  value={selectedMatchday}
                  onChange={(e) => setSelectedMatchday(Number(e.target.value))}
                >
                  {matches.matchdays.map((md) => (
                    <option key={md.matchday} value={md.matchday}>
                      {md.matchday}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Dreta: accions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={calculateStandings}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                Calcular
              </button>

              <button
                type="button"
                onClick={resetToRealStandings}
                disabled={!computedTable}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: computedTable ? "pointer" : "not-allowed",
                  opacity: computedTable ? 1 : 0.5
                }}
              >
                Tornar a real
              </button>

              <button
                type="button"
                onClick={clearPredictions}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                Netejar
              </button>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 6 }}>
                <input
                  type="checkbox"
                  checked={onlyFocusTeam}
                  onChange={(e) => setOnlyFocusTeam(e.target.checked)}
                />
                <span>Només CE Europa</span>
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 12 }}>
            {[
              { key: "all", label: `Tots (${matchCounts.all})` },
              { key: "played", label: `Jugats (${matchCounts.played})` },
              { key: "scheduled", label: `Pendents (${matchCounts.scheduled})` }
            ].map((x) => (
              <button
                key={x.key}
                type="button"
                onClick={() => {
                  const next = x.key as "all" | "played" | "scheduled";
                  setMatchFilter(next);
                  jumpToRelevantMatchday(next);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  background: matchFilter === x.key ? "#f6f6f6" : "white",
                  cursor: "pointer",
                  fontWeight: matchFilter === x.key ? 700 : 400
                }}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {!currentMatchday ? (
          <p>No hi ha dades d’aquesta jornada.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {currentMatchday.matches
              .filter((m) => (matchFilter === "all" ? true : m.status === matchFilter))
              .filter((m) =>
                !onlyFocusTeam
                  ? true
                  : m.homeTeamId === FOCUS_TEAM_ID || m.awayTeamId === FOCUS_TEAM_ID
              )
              .map((m) => (

                <li
                  key={m.matchId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(220px, 1fr) 140px minmax(220px, 1fr)",
                    gap: 12,
                    alignItems: "center",
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 12,
                    marginBottom: 10
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
          </ul>
        )}
      </section>
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

  function resetToRealStandings() {
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

  function jumpToRelevantMatchday(filter: "all" | "played" | "scheduled") {
    if (!matches) return;

    if (filter === "played") {
      // última jornada amb algun partit jugat
      for (let i = matches.matchdays.length - 1; i >= 0; i--) {
        const md = matches.matchdays[i];
        if (
          md.matches.some((m) => {
            const teamOk =
              !onlyFocusTeam ||
              m.homeTeamId === FOCUS_TEAM_ID ||
              m.awayTeamId === FOCUS_TEAM_ID;

            return teamOk && m.status === "played";
          })
        ) {
          setSelectedMatchday(md.matchday);
          return;
        }
      }
    }

    if (filter === "scheduled") {
      // primera jornada amb algun partit pendent
      for (let i = 0; i < matches.matchdays.length; i++) {
        const md = matches.matchdays[i];
        if (
          md.matches.some((m) => {
            const teamOk =
              !onlyFocusTeam ||
              m.homeTeamId === FOCUS_TEAM_ID ||
              m.awayTeamId === FOCUS_TEAM_ID;

            return teamOk && m.status === "scheduled";
          })
        ) {
          setSelectedMatchday(md.matchday);
          return;
        }
      }
    }
  }
}
