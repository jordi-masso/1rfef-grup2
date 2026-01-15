import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./api";
import type { MatchesJson, StandingsJson } from "./types";

export default function App() {
  const [standings, setStandings] = useState<StandingsJson | null>(null);
  const [matches, setMatches] = useState<MatchesJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);

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

  if (!standings || !matches) {
    return (
      <div style={{ padding: 16 }}>
        <h1>1RFEF Grup 2</h1>
        <p>Carregant dades…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>1RFEF Grup 2</h1>
        <small style={{ opacity: 0.7 }}>
          Actualitzat: {new Date(standings.updatedAt).toLocaleString()}
        </small>
      </header>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 8 }}>Classificació</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 8 }}>Pos</th>
                <th style={{ padding: 8 }}>Equip</th>
                <th style={{ padding: 8 }}>Pts</th>
                <th style={{ padding: 8 }}>PJ</th>
                <th style={{ padding: 8 }}>G</th>
                <th style={{ padding: 8 }}>E</th>
                <th style={{ padding: 8 }}>P</th>
                <th style={{ padding: 8 }}>GF</th>
                <th style={{ padding: 8 }}>GA</th>
                <th style={{ padding: 8 }}>DG</th>
              </tr>
            </thead>
            <tbody>
              {standings.table.map((r) => (
                <tr key={r.teamId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 8 }}>{r.pos}</td>
                  <td style={{ padding: 8 }}>{r.teamName}</td>
                  <td style={{ padding: 8, fontWeight: 700 }}>{r.pts}</td>
                  <td style={{ padding: 8 }}>{r.mp}</td>
                  <td style={{ padding: 8 }}>{r.w}</td>
                  <td style={{ padding: 8 }}>{r.d}</td>
                  <td style={{ padding: 8 }}>{r.l}</td>
                  <td style={{ padding: 8 }}>{r.gf}</td>
                  <td style={{ padding: 8 }}>{r.ga}</td>
                  <td style={{ padding: 8 }}>{r.gd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ marginBottom: 8 }}>Jornades</h2>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.7 }}>Jornada</span>
            <select value={selectedMatchday} onChange={(e) => setSelectedMatchday(Number(e.target.value))}>
              {matches.matchdays.map((md) => (
                <option key={md.matchday} value={md.matchday}>
                  {md.matchday}
                </option>
              ))}
            </select>
          </label>
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
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 12,
                  padding: 10,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  marginBottom: 10
                }}
              >
                <div style={{ textAlign: "right" }}>{m.homeName}</div>
                <div style={{ minWidth: 90, textAlign: "center", fontWeight: 700 }}>
                  {m.status === "played" && m.score ? `${m.score.home} - ${m.score.away}` : "vs"}
                </div>
                <div style={{ textAlign: "left" }}>{m.awayName}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

