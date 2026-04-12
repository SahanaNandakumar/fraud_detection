import { useState } from "react";

const API = "http://localhost:8000";

const FIELD_LABELS = {
  Time: { label: "Transaction Timestamp", hint: "Seconds since first transaction (0–172792)", group: "Transaction Info" },
  Amount: { label: "Transaction Amount ($)", hint: "Amount in euros", group: "Transaction Info" },
  V1:  { label: "Spending Pattern Score", hint: "Unusual spending behavior indicator", group: "Behavioral Scores" },
  V2:  { label: "Merchant Anomaly Score", hint: "Merchant type deviation indicator", group: "Behavioral Scores" },
  V3:  { label: "Transaction Velocity Score", hint: "Speed of transaction activity", group: "Behavioral Scores" },
  V4:  { label: "Purchase Category Score", hint: "Category deviation from normal", group: "Behavioral Scores" },
  V5:  { label: "Card Usage Pattern", hint: "Card activity pattern indicator", group: "Behavioral Scores" },
  V6:  { label: "Location Risk Score", hint: "Geographic risk indicator", group: "Risk Scores" },
  V7:  { label: "Time-of-Day Risk Score", hint: "Transaction timing risk", group: "Risk Scores" },
  V8:  { label: "Device Fingerprint Score", hint: "Device trust indicator", group: "Risk Scores" },
  V9:  { label: "Account Age Score", hint: "Account maturity indicator", group: "Risk Scores" },
  V10: { label: "IP Risk Score", hint: "Network origin risk indicator", group: "Risk Scores" },
  V11: { label: "Customer Loyalty Score", hint: "Customer relationship indicator", group: "Account Scores" },
  V12: { label: "Balance Deviation Score", hint: "Unusual balance movement indicator", group: "Account Scores" },
  V13: { label: "Credit Utilization Score", hint: "Credit usage pattern indicator", group: "Account Scores" },
  V14: { label: "Transaction Frequency Score", hint: "Unusual frequency indicator", group: "Account Scores" },
  V15: { label: "Weekend Activity Score", hint: "Off-hours transaction indicator", group: "Account Scores" },
  V16: { label: "Multi-Channel Risk Score", hint: "Cross-channel activity indicator", group: "Risk Scores" },
  V17: { label: "High-Value Alert Score", hint: "Large transaction risk indicator", group: "Risk Scores" },
  V18: { label: "Chargeback History Score", hint: "Past dispute indicator", group: "Account Scores" },
  V19: { label: "Login Behavior Score", hint: "Authentication pattern indicator", group: "Behavioral Scores" },
  V20: { label: "Session Duration Score", hint: "Interaction time indicator", group: "Behavioral Scores" },
  V21: { label: "Cart Behavior Score", hint: "Shopping pattern indicator", group: "Behavioral Scores" },
  V22: { label: "Shipping Anomaly Score", hint: "Delivery address risk indicator", group: "Behavioral Scores" },
  V23: { label: "Browser Fingerprint Score", hint: "Browser trust indicator", group: "Risk Scores" },
  V24: { label: "Email Domain Score", hint: "Email provider risk indicator", group: "Risk Scores" },
  V25: { label: "Phone Verification Score", hint: "Contact verification indicator", group: "Risk Scores" },
  V26: { label: "Address Match Score", hint: "Billing address match indicator", group: "Risk Scores" },
  V27: { label: "CVV Attempt Score", hint: "Card verification attempt indicator", group: "Risk Scores" },
  V28: { label: "Refund Pattern Score", hint: "Return behavior indicator", group: "Risk Scores" },
};

const GROUPS = ["Transaction Info", "Behavioral Scores", "Risk Scores", "Account Scores"];

const DEFAULT_LEGIT = {
  Time: 0, Amount: 149.62,
  V1: -1.3598071336738, V2: -0.0727811733098497, V3: 2.53634673796914,
  V4: 1.37815522427443, V5: -0.338320769942518, V6: 0.462387777762292,
  V7: 0.239598554061257, V8: 0.0986979012610507, V9: 0.363786969611213,
  V10: 0.0907941719789316, V11: -0.551599533260813, V12: -0.617800855762348,
  V13: -0.991389847235408, V14: -0.311169353699879, V15: 1.46817697209427,
  V16: -0.470400525259478, V17: 0.207971241929242, V18: 0.0257905801985591,
  V19: 0.403992960255733, V20: 0.251412098239705, V21: -0.018306777944153,
  V22: 0.277837575558899, V23: -0.110473910188767, V24: 0.0669280749146731,
  V25: 0.128539358273528, V26: -0.189114843888824, V27: 0.133558376740387,
  V28: -0.0210530534538215
};

const DEFAULT_FRAUD = {
  Time: 406, Amount: 149.62,
  V1: -2.3122265423263, V2: 1.95199201064158, V3: -1.60985073229769,
  V4: 3.9979055875468, V5: -0.522187864667764, V6: -1.42654531920595,
  V7: -2.53738730624579, V8: 1.39165724829804, V9: -2.77008927719433,
  V10: -2.77227214465915, V11: 3.20203320709635, V12: -2.89990738849473,
  V13: -0.595221881324605, V14: -4.28925378244217, V15: 0.389724120274487,
  V16: -1.14074717980657, V17: -2.83005567450437, V18: -0.0168224681808257,
  V19: 0.416955705037907, V20: 0.126910559061474, V21: 0.517232370861764,
  V22: -0.0350493686052974, V23: -0.465211076182388, V24: 0.320198198514526,
  V25: 0.0445191674733725, V26: 0.177839798284401, V27: 0.261145002567677,
  V28: -0.143275874698919
};

function RiskGauge({ score }) {
  const r = 70, cx = 100, cy = 90;
  const angle = (score / 100) * 180 - 180;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const color = score < 30 ? "#059669" : score < 60 ? "#d97706" : score < 80 ? "#ea580c" : "#dc2626";
  return (
    <svg viewBox="0 0 200 110" style={{ width: "100%", maxWidth: 260 }}>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      <text x="28" y={cy+18} fill="#94a3b8" fontSize="9">0</text>
      <text x={cx-4} y="22" fill="#94a3b8" fontSize="9">50</text>
      <text x="162" y={cy+18} fill="#94a3b8" fontSize="9">100</text>
    </svg>
  );
}

function WaterfallChart({ features, baseValue, finalProb }) {
  if (!features || features.length === 0) return null;
  const top = features.slice(0, 8);
  const maxAbs = Math.max(...top.map(f => Math.abs(f.shap_value)));
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {top.map((f, i) => {
          const isPos = f.shap_value > 0;
          const pct = (Math.abs(f.shap_value) / maxAbs) * 45;
          const key = Object.keys(FIELD_LABELS).find(k => FIELD_LABELS[k].label === f.feature) || f.feature;
          const displayName = FIELD_LABELS[key]?.label || f.feature;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 55px", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.7rem", fontFamily: "Space Mono", color: isPos ? "#dc2626" : "#059669", fontWeight: 700, lineHeight: 1.2 }}>
                {displayName}
              </span>
              <div style={{ position: "relative", height: 22, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#cbd5e1" }} />
                <div style={{
                  position: "absolute",
                  left: isPos ? "50%" : `${50 - pct}%`,
                  width: `${pct}%`, top: 2, bottom: 2,
                  background: isPos ? "linear-gradient(90deg, rgba(220,38,38,0.3), #dc2626)" : "linear-gradient(90deg, #059669, rgba(5,150,105,0.3))",
                  borderRadius: 3
                }} />
              </div>
              <span style={{ fontSize: "0.7rem", fontFamily: "Space Mono", textAlign: "right", color: isPos ? "#dc2626" : "#059669", fontWeight: 700 }}>
                {isPos ? "+" : ""}{f.shap_value.toFixed(3)}
              </span>
            </div>
          );
        })}
        <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: 8, marginTop: 4, display: "grid", gridTemplateColumns: "160px 1fr 55px", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "Space Mono", fontWeight: 700 }}>Final Score</span>
          <div style={{ position: "relative", height: 20, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, width: `${finalProb * 100}%`, top: 2, bottom: 2, background: finalProb > 0.6 ? "#dc2626" : finalProb > 0.3 ? "#d97706" : "#059669", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: "0.7rem", fontFamily: "Space Mono", textAlign: "right", fontWeight: 700, color: finalProb > 0.6 ? "#dc2626" : finalProb > 0.3 ? "#d97706" : "#059669" }}>
            {(finalProb * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: "0.72rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}><div style={{ width: 12, height: 4, borderRadius: 2, background: "#dc2626" }} /> Increases fraud risk</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}><div style={{ width: 12, height: 4, borderRadius: 2, background: "#059669" }} /> Decreases fraud risk</span>
      </div>
    </div>
  );
}

function SignalColumns({ features }) {
  if (!features) return null;
  const fraud = features.filter(f => f.shap_value > 0).slice(0, 4);
  const safe  = features.filter(f => f.shap_value < 0).slice(0, 4);
  const maxVal = Math.max(...features.map(f => Math.abs(f.shap_value)));
  const bar = (val, color) => (
    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 2, width: `${(Math.abs(val) / maxVal) * 100}%`, background: color }} />
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4, width: "100%" }}>
      <div style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>⚠ FRAUD SIGNALS</div>
        {fraud.length === 0 ? <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None detected</div>
        : fraud.map((f, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Space Mono", color: "#1e293b" }}>{f.feature}</span>
              <span style={{ fontSize: "0.7rem", fontFamily: "Space Mono", color: "#dc2626" }}>+{f.shap_value.toFixed(3)}</span>
            </div>
            {bar(f.shap_value, "#dc2626")}
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>✓ SAFE SIGNALS</div>
        {safe.length === 0 ? <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None detected</div>
        : safe.map((f, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Space Mono", color: "#1e293b" }}>{f.feature}</span>
              <span style={{ fontSize: "0.7rem", fontFamily: "Space Mono", color: "#059669" }}>{f.shap_value.toFixed(3)}</span>
            </div>
            {bar(f.shap_value, "#059669")}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlainEnglish({ features, isFraud, riskLevel }) {
  if (!features || features.length === 0) return null;
  const topFraud = features.filter(f => f.shap_value > 0).slice(0, 3).map(f => f.feature);
  const topSafe  = features.filter(f => f.shap_value < 0).slice(0, 2).map(f => f.feature);
  const explanation = isFraud
    ? `This transaction was flagged as fraudulent primarily because ${topFraud.join(", ")} showed suspicious patterns. ${topSafe.length > 0 ? `Although ${topSafe.join(" and ")} appeared relatively normal, they were not sufficient to override the fraud signals.` : ""} The model is ${riskLevel === "CRITICAL" ? "highly" : "moderately"} confident in this decision.`
    : `This transaction appears legitimate. ${topSafe.length > 0 ? `${topSafe.join(" and ")} showed normal patterns strongly suggesting a genuine transaction.` : ""} ${topFraud.length > 0 ? `While ${topFraud.join(", ")} showed slight anomalies, they were not significant enough to classify this as fraud.` : "No significant fraud signals were detected."}`;
  return (
    <div style={{ marginTop: 16, padding: 14, background: isFraud ? "rgba(220,38,38,0.05)" : "rgba(5,150,105,0.05)", border: `1px solid ${isFraud ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)"}`, borderRadius: 10 }}>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 6, letterSpacing: 1, fontWeight: 700 }}>💬 PLAIN ENGLISH EXPLANATION</div>
      <p style={{ fontSize: "0.83rem", color: "#1e293b", lineHeight: 1.6 }}>{explanation}</p>
    </div>
  );
}

export default function Predict() {
  const [form, setForm] = useState(DEFAULT_LEGIT);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState("Transaction Info");

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  };

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const [predRes, explainRes] = await Promise.all([
        fetch(`${API}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }),
        fetch(`${API}/explain`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      ]);
      setResult(await predRes.json());
      setExplanation(await explainRes.json());
    } catch (err) { setError("Could not connect to API. Make sure the backend is running."); }
    setLoading(false);
  };

  const groupedFields = GROUPS.map(group => ({
    group,
    fields: Object.entries(FIELD_LABELS).filter(([_, v]) => v.group === group)
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analyze Transaction</h1>
        <p className="page-subtitle">Enter transaction details for real-time fraud detection with AI explainability</p>
      </div>

      <div className="predict-layout">
        {/* LEFT — Form */}
        <div className="card" style={{ overflowY: "auto", maxHeight: "85vh" }}>
          <div className="card-title">◎ Transaction Details</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button className="btn-secondary" onClick={() => { setForm(DEFAULT_LEGIT); setResult(null); setExplanation(null); }}>
              ✓ Legit Sample
            </button>
            <button className="btn-secondary" onClick={() => { setForm(DEFAULT_FRAUD); setResult(null); setExplanation(null); }}
              style={{ borderColor: "#dc2626", color: "#dc2626" }}>
              ⚠ Fraud Sample
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {GROUPS.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer", fontFamily: "Syne, sans-serif",
                  background: activeGroup === g ? "var(--accent)" : "#fff",
                  color: activeGroup === g ? "#fff" : "var(--text-muted)",
                  borderColor: activeGroup === g ? "var(--accent)" : "var(--border)"
                }}>
                {g}
              </button>
            ))}
          </div>

          {groupedFields.filter(g => g.group === activeGroup).map(({ group, fields }) => (
            <div key={group} className="form-grid">
              {fields.map(([key, { label, hint }]) => (
                <div className="form-group" key={key}>
                  <label className="form-label" title={hint}>{label}</label>
                  <input className="form-input" type="number" name={key} step="0.001"
                    value={form[key]} onChange={handleChange} title={hint} />
                  <span style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 2 }}>{hint}</span>
                </div>
              ))}
            </div>
          ))}

          {error && <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626", fontSize: "0.85rem" }}>{error}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing..." : "▶ Analyze Transaction"}
          </button>
        </div>

        {/* RIGHT — Risk Gauge only */}
        <div className="result-panel">
          {!result ? (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.3 }}>🔍</div>
              <p style={{ color: "var(--text-muted)" }}>Fill in transaction details and click Analyze to see fraud detection result.</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 8 }}>Try the Legit or Fraud sample buttons to get started!</p>
            </div>
          ) : (
            <div className="card risk-gauge-wrap">
              <div className="risk-score-label">Fraud Risk Score</div>
              <RiskGauge score={result.risk_score} />
              <div className="risk-score-number" style={{ color: result.risk_score < 30 ? "#059669" : result.risk_score < 60 ? "#d97706" : "#dc2626" }}>
                {result.risk_score}%
              </div>
              <span className={`risk-level-badge risk-${result.risk_level}`}>{result.risk_level} RISK</span>
              <div style={{ marginTop: 16, fontSize: "1.1rem", fontWeight: 700, color: result.is_fraud ? "#dc2626" : "#059669" }}>
                {result.is_fraud ? "⚠ FRAUDULENT TRANSACTION" : "✓ LEGITIMATE TRANSACTION"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                Probability: {(result.probability * 100).toFixed(2)}% · Threshold: {result.threshold_used}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL WIDTH — Decision Waterfall */}
      {result && (
        <div className="card" style={{ marginTop: 24, boxSizing: "border-box" }}>
          <div className="card-title">◈ Decision Waterfall (SHAP)</div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>How each factor pushed the model toward or away from fraud.</p>
          <WaterfallChart features={explanation?.top_features} baseValue={explanation?.base_value} finalProb={result.probability} />
        </div>
      )}

      {/* FULL WIDTH — Fraud vs Safe Signals */}
      {result && (
        <div className="card" style={{ marginTop: 24, boxSizing: "border-box" }}>
          <div className="card-title">⊞ Fraud vs Safe Signals</div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>Factors split by whether they indicate fraud or legitimacy.</p>
          <SignalColumns features={explanation?.top_features} />
          <PlainEnglish features={explanation?.top_features} isFraud={result.is_fraud} riskLevel={result.risk_level} />
        </div>
      )}
    </div>
  );
}
