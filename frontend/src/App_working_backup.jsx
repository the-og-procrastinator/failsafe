import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// ─── Human-readable feature name map ───────────────────────────
const FEATURE_LABELS = {
  G2:               "Period 2 Grade",
  G1:               "Period 1 Grade",
  avg_grade:        "Average Grade",
  grade_trend:      "Grade Trend (G2−G1)",
  absences:         "Number of Absences",
  failures:         "Past Course Failures",
  studytime:        "Weekly Study Time",
  study_efficiency: "Study Efficiency",
  social_risk:      "Social Risk Score",
  support_score:    "Academic Support Score",
  parent_edu:       "Parental Education Level",
  goout:            "Goes Out Frequently",
  Dalc:             "Weekday Alcohol Use",
  Walc:             "Weekend Alcohol Use",
  famrel:           "Family Relationship Quality",
  freetime:         "Free Time After School",
  health:           "Health Status",
  higher:           "Aims for Higher Education",
  internet:         "Internet Access at Home",
  romantic:         "In a Romantic Relationship",
  activities:       "Extracurricular Activities",
  schoolsup:        "Extra School Support",
  famsup:           "Family Academic Support",
  paid:             "Paid Extra Classes",
  Medu:             "Mother's Education",
  Fedu:             "Father's Education",
  age:              "Student Age",
  absences_norm:    "Normalised Absences",
  traveltime:       "Travel Time to School",
  sex:              "Gender",
  address:          "Home Location",
};

function readableFeature(key) {
  return FEATURE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Demo students (real model features) ───────────────────────
const DEMO_STUDENTS_RAW = [
  { name:"Riya Sharma",  roll:"CS21001", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:2,Fedu:1,Mjob:2,Fjob:0,reason:1,guardian:0,traveltime:2,studytime:1,failures:2,schoolsup:0,famsup:0,paid:0,activities:0,nursery:1,higher:0,internet:1,romantic:0,famrel:3,freetime:4,goout:4,Dalc:2,Walc:3,health:3,absences:18,G1:5,G2:4,subject:0 },
  { name:"Arjun Patel",  roll:"CS21002", dept:"CSE", school:0,sex:1,age:16,address:1,famsize:1,Pstatus:1,Medu:4,Fedu:3,Mjob:3,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:3,failures:0,schoolsup:0,famsup:1,paid:1,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:2,goout:2,Dalc:1,Walc:1,health:5,absences:2,G1:15,G2:16,subject:0 },
  { name:"Sneha Rao",    roll:"EC21003", dept:"ECE", school:0,sex:0,age:18,address:0,famsize:0,Pstatus:0,Medu:1,Fedu:1,Mjob:0,Fjob:2,reason:2,guardian:1,traveltime:3,studytime:1,failures:1,schoolsup:1,famsup:0,paid:0,activities:0,nursery:0,higher:0,internet:0,romantic:1,famrel:2,freetime:5,goout:5,Dalc:3,Walc:4,health:2,absences:14,G1:7,G2:6,subject:1 },
  { name:"Karan Mehta",  roll:"ME21004", dept:"ME",  school:1,sex:1,age:15,address:1,famsize:1,Pstatus:1,Medu:3,Fedu:2,Mjob:1,Fjob:3,reason:0,guardian:1,traveltime:1,studytime:2,failures:0,schoolsup:1,famsup:1,paid:0,activities:1,nursery:1,higher:1,internet:1,romantic:0,famrel:4,freetime:3,goout:2,Dalc:1,Walc:2,health:4,absences:4,G1:13,G2:14,subject:0 },
  { name:"Priya Nair",   roll:"CS21005", dept:"CSE", school:0,sex:0,age:17,address:1,famsize:1,Pstatus:1,Medu:2,Fedu:2,Mjob:2,Fjob:2,reason:1,guardian:1,traveltime:2,studytime:2,failures:0,schoolsup:0,famsup:1,paid:1,activities:0,nursery:1,higher:1,internet:1,romantic:1,famrel:3,freetime:3,goout:3,Dalc:2,Walc:2,health:3,absences:6,G1:10,G2:11,subject:1 },
];

// ─── Risk colour scheme ─────────────────────────────────────────
function riskColor(score) {
  if (score >= 0.65) return { bg:"#2d0f0f", border:"#7f1d1d", accent:"#ef4444", label:"HIGH RISK",     badge:"#fee2e2", badgeText:"#991b1b" };
  if (score >= 0.38) return { bg:"#2d1f0a", border:"#78350f", accent:"#f59e0b", label:"MODERATE RISK", badge:"#fef3c7", badgeText:"#92400e" };
  return                     { bg:"#0a1f0f", border:"#14532d", accent:"#22c55e", label:"LOW RISK",      badge:"#dcfce7", badgeText:"#15803d" };
}

// ─── Build intervention plan from model output (no API key needed) ──
function buildInterventionPlan(student) {
  const risk = student.risk_score;
  const col  = riskColor(risk);
  const issues = student.interventions || [];

  const immediate = [];
  const shortTerm = [];
  const referrals = [];

  issues.forEach(item => {
    const issue = item.issue.toLowerCase();
    const impact = item.shap_impact;

    if (impact >= 1.0 || issue.includes("period 2") || issue.includes("g2")) {
      immediate.push(`Urgent academic review for ${student.name} — Period 2 grade is critically low. Schedule 1-on-1 with subject teacher this week.`);
      referrals.push({ type:"Head of Department", reason:"Critical grade deterioration requiring immediate escalation." });
    } else if (issue.includes("period 1") || issue.includes("g1") || issue.includes("average")) {
      immediate.push(`Arrange supplementary tutoring sessions to address weak foundational grades.`);
      shortTerm.push(`Monitor grade progress bi-weekly. Set minimum target of 10/20 for next assessment.`);
    } else if (issue.includes("absences") || issue.includes("attendance")) {
      immediate.push(`Contact parents/guardian within 48 hours regarding attendance pattern (${student.roll}).`);
      shortTerm.push(`Implement weekly attendance tracking. Flag if absences exceed 2 per week.`);
      referrals.push({ type:"Student Counsellor", reason:"Persistent absences may indicate personal or health issues." });
    } else if (issue.includes("failure") || issue.includes("past")) {
      immediate.push(`Enrol in remedial support programme — history of failures increases dropout risk.`);
      shortTerm.push(`Assign academic mentor (senior student or faculty) for weekly check-ins.`);
    } else if (issue.includes("study")) {
      shortTerm.push(`Provide structured weekly study plan. Recommend 2–3 hour daily study blocks.`);
      shortTerm.push(`Connect with library resources and peer study groups.`);
    } else if (issue.includes("social") || issue.includes("going out") || issue.includes("alcohol")) {
      shortTerm.push(`Counselling session focused on time management and social balance.`);
      referrals.push({ type:"Student Welfare Office", reason:"Social behaviour patterns correlating with academic underperformance." });
    }
  });

  // Always add monitoring
  const checkpoints = [
    { week:"Week 2",  check:"Verify attendance improvement and initial tutor sessions completed." },
    { week:"Week 4",  check:"Review next assessment result. Adjust plan if below target." },
    { week:"Week 8",  check:"Mid-semester evaluation — confirm student is on track to pass." },
    { week:"End of semester", check:`Target: ${student.name} achieves passing grade (≥10/20) in final exam.` },
  ];

  // Deduplicate
  const dedup = arr => [...new Set(arr)];
  return {
    riskLevel: col.label,
    riskScore: student.risk_percent,
    immediate: dedup(immediate).slice(0,4),
    shortTerm: dedup(shortTerm).slice(0,4),
    referrals:  dedup(referrals.map(r => `${r.type}: ${r.reason}`)).slice(0,3),
    checkpoints,
    issueCount: issues.length,
  };
}

// ─── Sub-components ─────────────────────────────────────────────

function RiskGauge({ score }) {
  const pct = Math.round(score * 100);
  const col = riskColor(score);
  const r=48, cx=64, cy=64, half=Math.PI*r, filled=(pct/100)*half;
  const x1=cx-r, x2=cx+r, y=cy;
  return (
    <div style={{textAlign:"center"}}>
      <svg width={128} height={72} viewBox="0 0 128 72">
        <path d={`M ${x1} ${y} A ${r} ${r} 0 0 1 ${x2} ${y}`} fill="none" stroke="#1e293b" strokeWidth={12} strokeLinecap="round"/>
        <path d={`M ${x1} ${y} A ${r} ${r} 0 0 1 ${x2} ${y}`} fill="none" stroke={col.accent}
          strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${filled} ${half}`}
          style={{transition:"stroke-dasharray 0.7s ease"}}/>
        <text x={cx} y={cy-4} textAnchor="middle" fill={col.accent} fontSize={24} fontWeight={800} fontFamily="monospace">{pct}%</text>
        <text x={cx} y={cy+13} textAnchor="middle" fill={col.accent} fontSize={10} letterSpacing={1} fontFamily="monospace">{col.label}</text>
      </svg>
    </div>
  );
}

function FeatureBar({ feature, value, maxVal }) {
  const label  = readableFeature(feature);
  const isRisk = value > 0;
  const pct    = Math.min(100, (Math.abs(value) / maxVal) * 100);
  const color  = isRisk ? "#ef4444" : "#22c55e";
  const sign   = isRisk ? "+" : "";
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:13,color:"#cbd5e1",fontWeight:500}}>{label}</span>
        <span style={{fontSize:12,color,fontFamily:"monospace",fontWeight:700}}>{sign}{value.toFixed(3)}</span>
      </div>
      <div style={{height:7,background:"#1e293b",borderRadius:4,overflow:"hidden"}}>
        <div style={{width:pct+"%",height:"100%",background:color,borderRadius:4,transition:"width 0.6s ease",opacity:0.9}}/>
      </div>
    </div>
  );
}

function PlanSection({ icon, title, items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:accent,textTransform:"uppercase"}}>{title}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map((item,i) => (
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"10px 14px"}}>
            <span style={{color:accent,fontWeight:700,fontSize:13,minWidth:20,fontFamily:"monospace"}}>{i+1}.</span>
            <span style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────
export default function Failsafe() {
  const [view, setView]         = useState("upload");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [plan, setPlan]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setTab]     = useState("analysis");
  const [error, setError]       = useState("");

  useEffect(() => { setPlan(null); setTab("analysis"); }, [selected?.id]);

  async function runDemo() {
    setView("loading"); setProgress(0); setError("");
    try {
      const results = [];
      for (let i = 0; i < DEMO_STUDENTS_RAW.length; i++) {
        const { name, roll, dept, ...features } = DEMO_STUDENTS_RAW[i];
        const res = await fetch(`${API_BASE}/predict`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify(features),
        });
        if (!res.ok) { const e=await res.json(); throw new Error(e.detail || `Error ${res.status}`); }
        const data = await res.json();
        // API already returns correct field names — just build interventions for plan generator
        const top_risk_factors       = data.top_risk_factors || [];
        const top_protective_factors = data.top_protective_factors || [];
        const interventions = top_risk_factors.map(f => ({
          issue: (FEATURE_LABELS[f.feature] || f.feature),
          shap_impact: f.shap_impact
        }));
        results.push({ name, roll, dept,
          risk_score:   data.risk_score,
          risk_level:   data.risk_level,
          risk_percent: data.risk_percent,
          top_risk_factors, top_protective_factors, interventions, id:i+1 });
        setProgress(Math.round(((i+1)/DEMO_STUDENTS_RAW.length)*100));
      }
      results.sort((a,b) => b.risk_score - a.risk_score);
      setStudents(results);
      setSelected(results[0]);
      setView("dashboard");
    } catch(e) {
      setError("Could not reach API. Make sure FastAPI is running: uvicorn api.main:app --reload --port 8000");
      setView("upload");
    }
  }

  // ── UPLOAD SCREEN ────────────────────────────────────────────
  if (view === "upload") return (
    <div style={{background:"#020817",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:480,padding:"0 20px"}}>
        {/* Logo */}
        <div style={{width:64,height:64,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:26,fontWeight:900,color:"#fff",letterSpacing:-1}}>FS</div>
        <h1 style={{fontSize:36,fontWeight:900,color:"#f8fafc",letterSpacing:"-0.03em",margin:"0 0 8px"}}>FAILSAFE</h1>
        <p style={{color:"#475569",fontSize:14,marginBottom:48,letterSpacing:"0.05em",textTransform:"uppercase"}}>Student Academic Risk Detection</p>

        <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"32px 28px",marginBottom:16}}>
          <p style={{color:"#64748b",fontSize:14,marginBottom:24,lineHeight:1.6}}>
            Powered by <strong style={{color:"#3b82f6"}}>XGBoost + SHAP</strong> — predicts which students are at risk of academic failure and explains exactly why.
          </p>
          <button onClick={runDemo} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#06b6d4)",border:"none",color:"#fff",padding:"14px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:"0.02em"}}>
            ▶&nbsp; Run Demo — 5 Sample Students
          </button>
        </div>
        {error && <div style={{background:"#2d0f0f",border:"1px solid #7f1d1d",borderRadius:10,padding:"12px 16px",color:"#fca5a5",fontSize:13,textAlign:"left"}}>{error}</div>}
        <p style={{marginTop:20,fontSize:12,color:"#334155"}}>
          <span style={{color:"#22c55e"}}>●</span>&nbsp; Connects to FastAPI at localhost:8000
        </p>
      </div>
    </div>
  );

  // ── LOADING SCREEN ────────────────────────────────────────────
  if (view === "loading") return (
    <div style={{background:"#020817",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:64,height:64,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:26,fontWeight:900,color:"#fff"}}>FS</div>
        <h2 style={{color:"#f8fafc",fontSize:20,fontWeight:700,marginBottom:8}}>Analysing students…</h2>
        <p style={{color:"#475569",fontSize:13,marginBottom:32}}>Running XGBoost predictions + SHAP explanations</p>
        <div style={{width:300,height:8,background:"#0f172a",borderRadius:4,overflow:"hidden",margin:"0 auto 12px",border:"1px solid #1e293b"}}>
          <div style={{width:progress+"%",height:"100%",background:"linear-gradient(90deg,#3b82f6,#06b6d4)",borderRadius:4,transition:"width 0.4s ease"}}/>
        </div>
        <p style={{color:"#3b82f6",fontSize:13,fontFamily:"monospace"}}>{progress}% complete</p>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────
  const stats = {
    total: students.length,
    high:  students.filter(s => s.risk_level === "HIGH").length,
    mod:   students.filter(s => s.risk_level === "MODERATE").length,
    low:   students.filter(s => s.risk_level === "LOW").length,
  };
  const col     = riskColor(selected.risk_score);
  const allShap = [...(selected.top_risk_factors||[]), ...(selected.top_protective_factors||[])];
  const maxShap = Math.max(...allShap.map(f => Math.abs(f.shap_impact)), 0.001);
  const initials = selected.name.split(" ").map(n=>n[0]).join("");

  return (
    <div style={{background:"#020817",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Top Nav ── */}
      <nav style={{background:"#0a0f1e",borderBottom:"1px solid #1e293b",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>FS</div>
          <span style={{fontWeight:800,fontSize:16,letterSpacing:"0.05em",color:"#f8fafc"}}>FAILSAFE</span>
          <span style={{color:"#334155",fontSize:12,marginLeft:4}}>Early Intervention System</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{display:"flex",gap:16}}>
            <Chip val={stats.total}   label="Total"    color="#64748b"/>
            <Chip val={stats.high}    label="High Risk" color="#ef4444"/>
            <Chip val={stats.mod}     label="Moderate"  color="#f59e0b"/>
            <Chip val={stats.low}     label="Low Risk"  color="#22c55e"/>
          </div>
          <button onClick={()=>setView("upload")} style={{background:"transparent",border:"1px solid #1e293b",color:"#64748b",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
            ← New Session
          </button>
        </div>
      </nav>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <aside style={{width:260,background:"#0a0f1e",borderRight:"1px solid #1e293b",overflowY:"auto",flexShrink:0}}>
          <div style={{padding:"12px 16px 8px",fontSize:11,fontWeight:700,color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            Students — Ranked by Risk
          </div>
          {students.map(s => {
            const c = riskColor(s.risk_score);
            const active = s.id === selected.id;
            const ini = s.name.split(" ").map(n=>n[0]).join("");
            return (
              <div key={s.id} onClick={()=>setSelected(s)} style={{
                padding:"12px 16px", cursor:"pointer",
                borderBottom:"1px solid #0f172a",
                background: active ? "#111827" : "transparent",
                borderLeft: active ? `3px solid ${c.accent}` : "3px solid transparent",
                transition:"all 0.15s",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c.accent,flexShrink:0}}>{ini}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:active?"#f8fafc":"#cbd5e1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                    <div style={{fontSize:11,color:"#475569",marginTop:2}}>{s.roll}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:800,color:c.accent,fontFamily:"monospace"}}>{s.risk_percent}</div>
                    <div style={{fontSize:9,fontWeight:700,color:c.accent,background:c.bg,border:`1px solid ${c.border}`,padding:"1px 5px",borderRadius:4,marginTop:2,whiteSpace:"nowrap"}}>{c.label}</div>
                  </div>
                </div>
                {/* Mini risk bar */}
                <div style={{height:3,background:"#1e293b",borderRadius:2,marginTop:8,overflow:"hidden"}}>
                  <div style={{width:s.risk_percent,height:"100%",background:c.accent,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </aside>

        {/* ── Main Panel ── */}
        <main style={{flex:1,overflowY:"auto",padding:24}}>

          {/* Student header card */}
          <div style={{background:"#0a0f1e",border:`1px solid ${col.border}`,borderRadius:14,padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:col.bg,border:`2px solid ${col.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:col.accent,flexShrink:0}}>{initials}</div>
            <div style={{flex:1}}>
              <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#f8fafc"}}>{selected.name}</h2>
              <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>{selected.roll} &nbsp;·&nbsp; {selected.dept} Engineering &nbsp;·&nbsp; Academic Risk Report</p>
            </div>
            <RiskGauge score={selected.risk_score}/>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginBottom:20,background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:10,padding:4,width:"fit-content"}}>
            {[["analysis","📊 Risk Analysis"],["plan","📋 Intervention Plan"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                background: activeTab===id ? "#1e293b" : "transparent",
                border:"none", color: activeTab===id ? "#f8fafc" : "#64748b",
                padding:"8px 20px", borderRadius:8, cursor:"pointer",
                fontSize:13, fontWeight:600, transition:"all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {/* ── Risk Analysis Tab ── */}
          {activeTab === "analysis" && (
            <div style={{display:"grid",gap:16}}>

              {/* SHAP Risk factors */}
              {selected.top_risk_factors.length > 0 && (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
                  <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"#ef4444"}}>▲ Risk-Increasing Factors</h3>
                  <p style={{margin:"0 0 18px",fontSize:12,color:"#475569"}}>Features pushing this student toward academic failure, ranked by impact (SHAP values).</p>
                  {selected.top_risk_factors.map(f=>(
                    <FeatureBar key={f.feature} feature={f.feature} value={f.shap_impact} maxVal={maxShap}/>
                  ))}
                </div>
              )}

              {/* SHAP Protective factors */}
              {selected.top_protective_factors.length > 0 && (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"20px 22px"}}>
                  <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"#22c55e"}}>▼ Protective Factors</h3>
                  <p style={{margin:"0 0 18px",fontSize:12,color:"#475569"}}>Features working in this student's favour, reducing their predicted risk.</p>
                  {selected.top_protective_factors.map(f=>(
                    <FeatureBar key={f.feature} feature={f.feature} value={f.shap_impact} maxVal={maxShap}/>
                  ))}
                </div>
              )}

              {/* No interventions = passing */}
              {selected.interventions.length === 0 && (
                <div style={{background:"#0a1f0f",border:"1px solid #14532d",borderRadius:14,padding:"20px 22px",display:"flex",alignItems:"center",gap:16}}>
                  <span style={{fontSize:28}}>✅</span>
                  <div>
                    <p style={{margin:0,fontWeight:700,color:"#22c55e",fontSize:15}}>No interventions required</p>
                    <p style={{margin:"4px 0 0",fontSize:13,color:"#475569"}}>This student is performing within acceptable ranges. Continue standard monitoring.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Intervention Plan Tab ── */}
          {activeTab === "plan" && (
            <div>
              {!plan ? (
                <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"32px",textAlign:"center"}}>
                  <span style={{fontSize:36,display:"block",marginBottom:16}}>📋</span>
                  <h3 style={{color:"#f8fafc",fontWeight:700,marginBottom:8}}>Generate Intervention Plan</h3>
                  <p style={{color:"#475569",fontSize:14,marginBottom:24,maxWidth:400,margin:"0 auto 24px",lineHeight:1.7}}>
                    FAILSAFE will analyse <strong style={{color:"#3b82f6"}}>{selected.name}</strong>'s risk profile and generate a structured, actionable plan for faculty.
                  </p>
                  <button onClick={()=>setPlan(buildInterventionPlan(selected))} style={{background:"linear-gradient(135deg,#3b82f6,#06b6d4)",border:"none",color:"#fff",padding:"12px 32px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700}}>
                    Generate Plan for {selected.name}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Plan header */}
                  <div style={{background:"#0a0f1e",border:`1px solid ${col.border}`,borderRadius:14,padding:"18px 22px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <h3 style={{margin:0,color:"#f8fafc",fontSize:16,fontWeight:700}}>Intervention Plan — {selected.name}</h3>
                      <p style={{margin:"4px 0 0",fontSize:12,color:"#475569"}}>{selected.roll} · Risk Score: <span style={{color:col.accent,fontWeight:700}}>{plan.riskScore} {plan.riskLevel}</span> · {plan.issueCount} issues flagged by model</p>
                    </div>
                    <button onClick={()=>setPlan(null)} style={{background:"transparent",border:"1px solid #1e293b",color:"#64748b",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>↩ Reset</button>
                  </div>

                  <div style={{background:"#0a0f1e",border:"1px solid #1e293b",borderRadius:14,padding:"22px 24px"}}>
                    <PlanSection icon="⚡" title="Immediate Actions (within 1 week)"    items={plan.immediate}   accent="#ef4444"/>
                    <PlanSection icon="📅" title="Short-Term Plan (2–4 weeks)"          items={plan.shortTerm}   accent="#f59e0b"/>
                    <PlanSection icon="🔗" title="Referrals"                            items={plan.referrals}   accent="#a78bfa"/>

                    {/* Checkpoints */}
                    <div style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{fontSize:16}}>📍</span>
                        <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:"#06b6d4",textTransform:"uppercase"}}>Monitoring Checkpoints</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {plan.checkpoints.map((cp,i)=>(
                          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"10px 14px"}}>
                            <span style={{color:"#06b6d4",fontWeight:700,fontSize:12,minWidth:80,fontFamily:"monospace"}}>{cp.week}</span>
                            <span style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{cp.check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:8,padding:"12px 16px",fontSize:12,color:"#475569"}}>
                      ℹ️ This plan was generated using SHAP model explanations. All recommendations should be reviewed and validated by faculty before implementation.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Chip({ val, label, color }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:16,fontWeight:800,color,fontFamily:"monospace"}}>{val}</span>
      <span style={{fontSize:11,color:"#475569"}}>{label}</span>
    </div>
  );
}
