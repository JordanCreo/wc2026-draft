import { useState, useEffect, useCallback } from "react";

// ── DATA ────────────────────────────────────────────────────────────────────
const PARTICIPANTS = [
  "Jordan McConville","Jordan Thorne","Connor Jones","Eugene Tan",
  "Jon Budge","Jon Penny","Megan Knowles","Kat Shaw","Richard Ward",
  "Nick Coakley","Michael Partridge",
];

const ALL_TEAMS = [
  { name:"United States",    flag:"🇺🇸", conf:"Host"     },
  { name:"Canada",           flag:"🇨🇦", conf:"Host"     },
  { name:"Mexico",           flag:"🇲🇽", conf:"Host"     },
  { name:"England",          flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf:"UEFA"     },
  { name:"France",           flag:"🇫🇷", conf:"UEFA"     },
  { name:"Spain",            flag:"🇪🇸", conf:"UEFA"     },
  { name:"Germany",          flag:"🇩🇪", conf:"UEFA"     },
  { name:"Portugal",         flag:"🇵🇹", conf:"UEFA"     },
  { name:"Netherlands",      flag:"🇳🇱", conf:"UEFA"     },
  { name:"Belgium",          flag:"🇧🇪", conf:"UEFA"     },
  { name:"Croatia",          flag:"🇭🇷", conf:"UEFA"     },
  { name:"Switzerland",      flag:"🇨🇭", conf:"UEFA"     },
  { name:"Austria",          flag:"🇦🇹", conf:"UEFA"     },
  { name:"Scotland",         flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf:"UEFA"     },
  { name:"Norway",           flag:"🇳🇴", conf:"UEFA"     },
  { name:"Türkiye",          flag:"🇹🇷", conf:"UEFA"     },
  { name:"Sweden",           flag:"🇸🇪", conf:"UEFA"     },
  { name:"Czechia",          flag:"🇨🇿", conf:"UEFA"     },
  { name:"Bosnia & Herz.",   flag:"🇧🇦", conf:"UEFA"     },
  { name:"Argentina",        flag:"🇦🇷", conf:"CONMEBOL" },
  { name:"Brazil",           flag:"🇧🇷", conf:"CONMEBOL" },
  { name:"Uruguay",          flag:"🇺🇾", conf:"CONMEBOL" },
  { name:"Colombia",         flag:"🇨🇴", conf:"CONMEBOL" },
  { name:"Ecuador",          flag:"🇪🇨", conf:"CONMEBOL" },
  { name:"Paraguay",         flag:"🇵🇾", conf:"CONMEBOL" },
  { name:"Morocco",          flag:"🇲🇦", conf:"CAF"      },
  { name:"Senegal",          flag:"🇸🇳", conf:"CAF"      },
  { name:"Egypt",            flag:"🇪🇬", conf:"CAF"      },
  { name:"Algeria",          flag:"🇩🇿", conf:"CAF"      },
  { name:"Ghana",            flag:"🇬🇭", conf:"CAF"      },
  { name:"Côte d'Ivoire",   flag:"🇨🇮", conf:"CAF"      },
  { name:"Tunisia",          flag:"🇹🇳", conf:"CAF"      },
  { name:"South Africa",     flag:"🇿🇦", conf:"CAF"      },
  { name:"Cabo Verde",       flag:"🇨🇻", conf:"CAF"      },
  { name:"DR Congo",         flag:"🇨🇩", conf:"CAF"      },
  { name:"Japan",            flag:"🇯🇵", conf:"AFC"      },
  { name:"South Korea",      flag:"🇰🇷", conf:"AFC"      },
  { name:"Iran",             flag:"🇮🇷", conf:"AFC"      },
  { name:"Saudi Arabia",     flag:"🇸🇦", conf:"AFC"      },
  { name:"Australia",        flag:"🇦🇺", conf:"AFC"      },
  { name:"Qatar",            flag:"🇶🇦", conf:"AFC"      },
  { name:"Jordan",           flag:"🇯🇴", conf:"AFC"      },
  { name:"Uzbekistan",       flag:"🇺🇿", conf:"AFC"      },
  { name:"Iraq",             flag:"🇮🇶", conf:"AFC"      },
  { name:"Panama",           flag:"🇵🇦", conf:"CONCACAF" },
  { name:"Honduras",         flag:"🇭🇳", conf:"CONCACAF" },
  { name:"Jamaica",          flag:"🇯🇲", conf:"CONCACAF" },
  { name:"New Zealand",      flag:"🇳🇿", conf:"OFC"      },
  { name:"Cabo Verde",       flag:"🇨🇻", conf:"CAF"      },
];

// Remove duplicate Cabo Verde
const TEAMS = ALL_TEAMS.filter((t, i, a) => a.findIndex(x => x.name === t.name) === i);

const STAGES = [
  { key:"group",   label:"Group Stage",   pts:1, icon:"🏟️"  },
  { key:"r16",     label:"Round of 16",   pts:2, icon:"⚔️"  },
  { key:"qf",      label:"Quarter-Final", pts:3, icon:"🔥"  },
  { key:"sf",      label:"Semi-Final",    pts:5, icon:"⭐"  },
  { key:"final",   label:"Final",         pts:8, icon:"🥈"  },
  { key:"winner",  label:"Champion",      pts:13,icon:"🏆"  },
];

const CONF_COLOR = {
  Host:"#f59e0b", UEFA:"#3b82f6", CONMEBOL:"#10b981",
  CAF:"#ef4444",  AFC:"#8b5cf6",  CONCACAF:"#f97316", OFC:"#06b6d4",
};

const MEDAL = ["🥇","🥈","🥉"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcPoints(teamProgress) {
  // teamProgress: { group: bool, r16: bool, ... }
  let pts = 0;
  for (const s of STAGES) {
    if (teamProgress?.[s.key]) pts += s.pts;
  }
  return pts;
}

function totalPoints(teams, progress) {
  return teams.reduce((sum, t) => sum + calcPoints(progress[t.name]), 0);
}

const STORAGE_KEY = "wc2026_draft_v2";

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState("leaderboard"); // leaderboard | draw | results
  const [draft, setDraft]       = useState(null);   // [{name, teams:[]}]
  const [progress, setProgress] = useState({});     // { teamName: { group:bool, r16:bool,... } }
  const [editingPerson, setEditingPerson] = useState(null);
  const [drawing, setDrawing]   = useState(false);
  const [toast, setToast]       = useState(null);

  // ── Persist ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { draft: d, progress: p } = JSON.parse(saved);
        if (d) setDraft(d);
        if (p) setProgress(p);
      }
    } catch {}
  }, []);

  const save = useCallback((d, p) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: d, progress: p })); } catch {}
  }, []);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const runDraw = () => {
    setDrawing(true);
    setTimeout(() => {
      const shuffled = shuffle(TEAMS);
      const n = PARTICIPANTS.length;
      const perPerson = Math.floor(TEAMS.length / n);
      const remainder = TEAMS.length % n;

      // Base allocation
      const newDraft = PARTICIPANTS.map((name, i) => ({
        name,
        teams: shuffled.slice(i * perPerson, (i + 1) * perPerson),
      }));

      // Randomly assign leftover teams to distinct participants
      const leftovers = shuffled.slice(n * perPerson);
      const luckyIdxs = shuffle([...Array(n).keys()]).slice(0, leftovers.length);
      leftovers.forEach((team, i) => {
        newDraft[luckyIdxs[i]].teams.push({ ...team, bonus: true });
      });

      setDraft(newDraft);
      setProgress({});
      save(newDraft, {});
      setDrawing(false);
      setView("leaderboard");
      showToast("✅ Teams drawn! Good luck everyone!");
    }, 800);
  };

  // ── Progress toggle ───────────────────────────────────────────────────────
  const toggleStage = (teamName, stageKey) => {
    const stage = STAGES.find(s => s.key === stageKey);
    const stageIdx = STAGES.findIndex(s => s.key === stageKey);
    const current = progress[teamName] || {};
    const isOn = !!current[stageKey];

    let updated = { ...current };
    if (!isOn) {
      // turning on: also turn on all prior stages
      for (let i = 0; i <= stageIdx; i++) updated[STAGES[i].key] = true;
    } else {
      // turning off: also turn off all later stages
      for (let i = stageIdx; i < STAGES.length; i++) updated[STAGES[i].key] = false;
    }

    const newProgress = { ...progress, [teamName]: updated };
    setProgress(newProgress);
    save(draft, newProgress);
    if (!isOn) showToast(`+${stage.pts}pts — ${teamName} ${stage.icon}`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Leaderboard data ──────────────────────────────────────────────────────
  const leaderboard = (() => {
    if (!draft) return [];
    const sorted = [...draft]
      .map(p => ({ ...p, pts: totalPoints(p.teams, progress) }))
      .sort((a, b) => b.pts - a.pts);
    let rank = 1;
    return sorted.map((p, i) => {
      if (i > 0 && sorted[i].pts < sorted[i-1].pts) rank = i + 1;
      return { ...p, rank };
    });
  })();

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #03080f; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }

    @keyframes fadeUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes slideIn {
      from { transform: translateY(80px); opacity:0; }
      to   { transform: translateY(0);    opacity:1; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
  `;

  const wrap = {
    minHeight:"100vh",
    background:"linear-gradient(160deg,#03080f 0%,#061428 55%,#03080f 100%)",
    fontFamily:"'Manrope',sans-serif",
    color:"#e2e8f0",
    paddingBottom:"80px",
    position:"relative",
    overflowX:"hidden",
  };

  const header = {
    textAlign:"center",
    padding:"1.5rem 1rem 1rem",
    borderBottom:"1px solid rgba(255,255,255,0.06)",
  };

  const titleStyle = {
    fontFamily:"'Syne',sans-serif",
    fontWeight:800,
    fontSize:"clamp(1.9rem,7vw,3rem)",
    letterSpacing:"-0.02em",
    background:"linear-gradient(90deg,#38bdf8,#818cf8,#c084fc)",
    WebkitBackgroundClip:"text",
    WebkitTextFillColor:"transparent",
    backgroundClip:"text",
    backgroundSize:"200% auto",
    animation:"shimmer 4s linear infinite",
    lineHeight:1,
  };

  const navBar = {
    position:"fixed",
    bottom:0, left:0, right:0,
    background:"rgba(3,8,15,0.95)",
    backdropFilter:"blur(12px)",
    borderTop:"1px solid rgba(255,255,255,0.08)",
    display:"flex",
    zIndex:100,
  };

  const navBtn = (active) => ({
    flex:1,
    padding:"0.75rem 0.5rem",
    background:"none",
    border:"none",
    color: active ? "#38bdf8" : "#475569",
    fontSize:"0.7rem",
    fontWeight:700,
    fontFamily:"'Manrope',sans-serif",
    cursor:"pointer",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    gap:"3px",
    letterSpacing:"0.05em",
    textTransform:"uppercase",
    transition:"color 0.2s",
    borderTop: active ? "2px solid #38bdf8" : "2px solid transparent",
  });

  // ── LEADERBOARD VIEW ──────────────────────────────────────────────────────
  const LeaderboardView = () => (
    <div style={{ padding:"1rem", maxWidth:480, margin:"0 auto" }}>
      {!draft ? (
        <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
          <div style={{ fontSize:"4rem", marginBottom:"1rem" }}>⚽</div>
          <p style={{ color:"#64748b", marginBottom:"1.5rem" }}>No draft yet. Run the draw to get started!</p>
          <button onClick={() => setView("draw")} style={goldBtn}>
            Go to Draw
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:"0.75rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.01em", color:"#94a3b8" }}>STANDINGS</span>
            <span style={{ fontSize:"0.75rem", color:"#475569" }}>{STAGES.filter(s=>Object.values(progress).some(p=>p[s.key])).length} stages active</span>
          </div>
          {leaderboard.map((person, i) => (
            <div key={person.name}
              onClick={() => { setEditingPerson(person.name); setView("results"); }}
              style={{
                background: i === 0
                  ? "linear-gradient(135deg,rgba(56,189,248,0.12),rgba(129,140,248,0.06))"
                  : "rgba(255,255,255,0.03)",
                border: i === 0
                  ? "1px solid rgba(56,189,248,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius:14,
                padding:"0.9rem 1rem",
                marginBottom:"0.6rem",
                display:"flex",
                alignItems:"center",
                gap:"0.75rem",
                cursor:"pointer",
                animation:`fadeUp 0.4s ease ${i*0.06}s both`,
                transition:"transform 0.15s",
              }}
            >
              {/* Rank */}
              <div style={{
                width:32, textAlign:"center", flexShrink:0,
                fontFamily:"'Syne',sans-serif",
                fontWeight:800,
                fontSize: person.rank <= 3 ? "1.5rem" : "1rem",
                lineHeight:1,
                color: person.rank > 3 ? "#475569" : undefined,
              }}>
                {person.rank === 1 ? "🥇" : person.rank === 2 ? "🥈" : person.rank === 3 ? "🥉" : `${person.rank}`}
              </div>

              {/* Name + teams preview */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:"0.25rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {person.name.split(" ")[0]} <span style={{ color:"#94a3b8", fontWeight:400 }}>{person.name.split(" ").slice(1).join(" ")}</span>
                </div>
                <div style={{ fontSize:"1rem", letterSpacing:"0.05em" }}>
                  {person.teams.slice(0,5).map(t => t.flag).join(" ")}
                  {person.teams.length > 5 && <span style={{ color:"#475569", fontSize:"0.7rem" }}> +{person.teams.length-5}</span>}
                </div>
              </div>

              {/* Points */}
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{
                  fontFamily:"'Syne',sans-serif",
                  fontWeight:800,
                  fontSize:"1.8rem",
                  lineHeight:1,
                  color: person.pts > 0 ? "#38bdf8" : "#1e3a5f",
                }}>
                  {person.pts}
                </div>
                <div style={{ fontSize:"0.65rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.05em" }}>pts</div>
              </div>
              <div style={{ color:"#334155", fontSize:"0.8rem" }}>›</div>
            </div>
          ))}

          {/* Points key */}
          <div style={{ marginTop:"1.5rem", padding:"1rem", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:"0.7rem", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.6rem" }}>Points Key</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.4rem" }}>
              {STAGES.map(s => (
                <div key={s.key} style={{ fontSize:"0.72rem", color:"#94a3b8", display:"flex", gap:"4px", alignItems:"center" }}>
                  <span>{s.icon}</span>
                  <span style={{ color:"#38bdf8", fontWeight:700 }}>{s.pts}pt</span>
                  <span style={{ color:"#475569" }}>{s.label.split(" ").pop()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── RESULTS VIEW ──────────────────────────────────────────────────────────
  const ResultsView = () => {
    const person = editingPerson
      ? draft?.find(p => p.name === editingPerson)
      : null;

    if (!draft) return (
      <div style={{ padding:"2rem", textAlign:"center", color:"#64748b" }}>
        Run the draw first!
      </div>
    );

    if (!person) {
      // Person selector
      return (
        <div style={{ padding:"1rem", maxWidth:480, margin:"0 auto" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.01em", color:"#94a3b8", marginBottom:"0.75rem" }}>UPDATE RESULTS</div>
          <p style={{ fontSize:"0.85rem", color:"#64748b", marginBottom:"1rem" }}>Tap a person to update their teams' progress.</p>
          {draft.map(p => (
            <button key={p.name} onClick={() => setEditingPerson(p.name)} style={{
              width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:12, padding:"0.85rem 1rem", marginBottom:"0.5rem", color:"#e2e8f0",
              fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", fontWeight:600,
              cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              {p.name}
              <span style={{ color:"#475569" }}>›</span>
            </button>
          ))}
        </div>
      );
    }

    const personPts = totalPoints(person.teams, progress);

    return (
      <div style={{ padding:"1rem", maxWidth:480, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem" }}>
          <button onClick={() => setEditingPerson(null)} style={{
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8, padding:"0.4rem 0.75rem", color:"#94a3b8",
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem",
          }}>← Back</button>
          <div>
            <div style={{ fontWeight:700, fontSize:"1rem" }}>{person.name}</div>
            <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{personPts} points total</div>
          </div>
        </div>

        {person.teams.map(team => {
          const tp = progress[team.name] || {};
          const teamPts = calcPoints(tp);
          const highestStage = STAGES.filter(s => tp[s.key]).pop();
          return (
            <div key={team.name} style={{
              background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:14, padding:"0.9rem 1rem", marginBottom:"0.75rem",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.7rem" }}>
                <span style={{ fontSize:"1.6rem" }}>{team.flag}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    {team.name}
                    {team.bonus && <span style={{ fontSize:"0.6rem", background:"rgba(245,158,11,0.2)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.4)", borderRadius:4, padding:"1px 5px", fontWeight:700, letterSpacing:"0.05em" }}>BONUS</span>}
                  </div>
                  <div style={{ fontSize:"0.7rem", color: CONF_COLOR[team.conf] || "#94a3b8" }}>{team.conf}</div>
                </div>
                <div style={{
                  fontFamily:"'Syne',sans-serif",
                  fontWeight:800,
                  fontSize:"1.5rem",
                  color: teamPts > 0 ? "#38bdf8" : "#1e3a5f",
                }}>
                  {teamPts}pt
                </div>
              </div>

              {/* Stage buttons */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.4rem" }}>
                {STAGES.map(s => {
                  const on = !!tp[s.key];
                  return (
                    <button key={s.key} onClick={() => toggleStage(team.name, s.key)} style={{
                      padding:"0.45rem 0.25rem",
                      borderRadius:8,
                      border: on ? "1px solid rgba(56,189,248,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      background: on ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
                      color: on ? "#bae6fd" : "#475569",
                      fontSize:"0.65rem",
                      fontWeight:700,
                      fontFamily:"'DM Sans',sans-serif",
                      cursor:"pointer",
                      textAlign:"center",
                      transition:"all 0.15s",
                      lineHeight:1.3,
                    }}>
                      <div style={{ fontSize:"0.9rem" }}>{s.icon}</div>
                      <div style={{ textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.label.split(" ").pop()}</div>
                      <div style={{ color: on ? "#38bdf8" : "#1e3a5f" }}>+{s.pts}pt</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── DRAW VIEW ─────────────────────────────────────────────────────────────
  const DrawView = () => (
    <div style={{ padding:"1rem", maxWidth:480, margin:"0 auto", textAlign:"center" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.01em", color:"#94a3b8", marginBottom:"0.5rem" }}>THE DRAW</div>
        <p style={{ fontSize:"0.85rem", color:"#64748b", lineHeight:1.5 }}>
          {draft ? "A draw already exists. Redrawing will reset all progress." : "Randomly assign all 48 World Cup teams across 11 participants."}
        </p>
      </div>

      <button onClick={runDraw} disabled={drawing} style={{
        ...goldBtn,
        opacity: drawing ? 0.6 : 1,
        display:"flex", alignItems:"center", gap:"0.5rem", margin:"0 auto 2rem",
      }}>
        {drawing
          ? <><span style={{ display:"inline-block", animation:"spin 0.8s linear infinite" }}>⚽</span> Drawing...</>
          : draft ? "🔄 Redraw (resets all points)" : "🎲 Draw Teams Now"
        }
      </button>

      {draft && (
        <div>
          {draft.map((p, i) => {
            const pts = totalPoints(p.teams, progress);
            return (
              <div key={p.name} style={{
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:12, padding:"0.9rem 1rem", marginBottom:"0.6rem", textAlign:"left",
              }}>
                <div style={{ fontWeight:700, fontSize:"0.9rem", marginBottom:"0.5rem", display:"flex", justifyContent:"space-between" }}>
                  {p.name}
                  <span style={{ color:"#38bdf8", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.1rem" }}>{pts}pt</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                  {p.teams.map(t => (
                    <span key={t.name} title={t.name} style={{
                      background: t.bonus ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)",
                      border: t.bonus ? "1px solid rgba(245,158,11,0.3)" : "none",
                      borderRadius:6,
                      padding:"2px 7px", fontSize:"0.75rem", color: t.bonus ? "#fde68a" : "#94a3b8",
                      display:"flex", alignItems:"center", gap:"4px",
                    }}>
                      {t.flag} {t.name}{t.bonus ? " ⭐" : ""}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const goldBtn = {
    padding:"0.8rem 2rem",
    background:"linear-gradient(90deg,#38bdf8,#818cf8)",
    color:"#fff",
    border:"none",
    borderRadius:50,
    fontWeight:700,
    fontFamily:"'Manrope',sans-serif",
    fontSize:"0.95rem",
    cursor:"pointer",
    letterSpacing:"0.03em",
    boxShadow:"0 0 28px rgba(56,189,248,0.3)",
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={wrap}>
        {/* Header */}
        <div style={header}>
          <div style={{ fontSize:"1.6rem", lineHeight:1 }}>⚽</div>
          <div style={titleStyle}>World Cup 2026</div>
          <div style={{ fontSize:"0.7rem", color:"#475569", letterSpacing:"0.2em", textTransform:"uppercase", marginTop:"2px" }}>
            Workplace Draft
          </div>
        </div>

        {/* Views */}
        {view === "leaderboard" && <LeaderboardView />}
        {view === "results"     && <ResultsView />}
        {view === "draw"        && <DrawView />}

        {/* Toast */}
        {toast && (
          <div style={{
            position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
            background:"#0d1f35", border:"1px solid rgba(56,189,248,0.4)",
            borderRadius:50, padding:"0.6rem 1.25rem",
            color:"#bae6fd", fontSize:"0.85rem", fontWeight:600,
            zIndex:200, whiteSpace:"nowrap",
            animation:"slideIn 0.3s ease",
            boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
          }}>
            {toast}
          </div>
        )}

        {/* Nav */}
        <nav style={navBar}>
          {[
            { id:"leaderboard", icon:"🏆", label:"Leaderboard" },
            { id:"results",     icon:"⚽", label:"Results"     },
            { id:"draw",        icon:"🎲", label:"Draw"        },
          ].map(n => (
            <button key={n.id} onClick={() => { setView(n.id); if (n.id !== "results") setEditingPerson(null); }} style={navBtn(view === n.id)}>
              <span style={{ fontSize:"1.3rem" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
