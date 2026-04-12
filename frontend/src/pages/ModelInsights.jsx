import { useEffect, useState } from "react";
import {
  BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const API = "http://localhost:8000";

const RISK_COLORS = {
  LOW: "#00e096",
  MEDIUM: "#ffaa00",
  HIGH: "#ff7043",
  CRITICAL: "#ff3d71"
};

export default function ModelInsights() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [threshold, setThreshold] = useState(0.5);
  const [thresholdResult, setThresholdResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/metrics`).then(r => r.json()),
      fetch(`${API}/history?limit=200`).then(r => r.json())
    ]).then(([m, h]) => {
      setMetrics(m);
      setHistory(h.predictions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleThreshold = async (val) => {
    setThreshold(val);
    try {
      const res = await fetch(`${API}/threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: val })
      });
      setThresholdResult(await res.json());
    } catch (e) {}
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading insights...</span></div>;
  if (!metrics) return <div className="empty-state"><h3>Could not load metrics</h3><p>Make sure the backend is running.</p></div>;

  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  let fraudAmount = 0, legitAmount = 0;
  let fraudAmountCount = 0, legitAmountCount = 0;

  history.forEach(p => {
    if (riskCounts[p.risk_level] !== undefined) riskCounts[p.risk_level]++;
    if (p.amount) {
      if (p.is_fraud) { fraudAmount += p.amount; fraudAmountCount++; }
      else { legitAmount += p.amount; legitAmountCount++; }
    }
  });

  const riskDistData = Object.entries(riskCounts).map(([level, count]) => ({
    level, count, fill: RISK_COLORS[level]
  }));

  const avgFraudAmount = fraudAmountCount > 0 ? (fraudAmount / fraudAmountCount).toFixed(2) : 0;
  const avgLegitAmount = legitAmountCount > 0 ? (legitAmount / legitAmountCount).toFixed(2) : 0;

  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 10}`,
    count: 0,
    fill: i < 3 ? "#00e096" : i < 6 ? "#ffaa00" : i < 8 ? "#ff7043" : "#ff3d71"
  }));
  history.forEach(p => {
    const idx = Math.min(Math.floor(p.risk_score / 10), 9);
    buckets[idx].count++;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Model Insights</h1>
        <p className="page-subtitle">Risk analysis, performance metrics, and threshold tuning</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {Object.entries(riskCounts).map(([level, count]) => (
          <div className="stat-card" key={level}>
            <div className="stat-label">{level} RISK</div>
            <div className="stat-value" style={{ color: RISK_COLORS[level] }}>{count}</div>
            <div className="stat-sub">transactions</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">▦ Risk Level Distribution</div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 12 }}>
            How analyzed transactions are distributed across risk levels.
          </p>
          {history.length === 0 ? (
            <div className="empty-state"><h3>No data yet</h3><p>Analyze transactions to see distribution</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDistData}>
                <XAxis dataKey="level" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0c1120", border: "1px solid #1e2d4a", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-title">◈ Risk Score Histogram</div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 12 }}>
            Distribution of fraud probability scores across all transactions.
          </p>
          {history.length === 0 ? (
            <div className="empty-state"><h3>No data yet</h3><p>Analyze transactions to see histogram</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buckets}>
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0c1120", border: "1px solid #1e2d4a", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">$ Average Transaction Amount</div>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            <div style={{ flex: 1, padding: 20, borderRadius: 10, background: "rgba(255,61,113,0.08)", border: "1px solid rgba(255,61,113,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>FRAUDULENT</div>
              <div style={{ fontFamily: "Space Mono", fontSize: "1.8rem", color: "var(--danger)" }}>${avgFraudAmount}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{fraudAmountCount} transactions</div>
            </div>
            <div style={{ flex: 1, padding: 20, borderRadius: 10, background: "rgba(0,224,150,0.08)", border: "1px solid rgba(0,224,150,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>LEGITIMATE</div>
              <div style={{ fontFamily: "Space Mono", fontSize: "1.8rem", color: "var(--success)" }}>${avgLegitAmount}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{legitAmountCount} transactions</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">◎ Fraud vs Legitimate Ratio</div>
          {history.length === 0 ? (
            <div className="empty-state"><h3>No data yet</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Legitimate", value: legitAmountCount },
                    { name: "Fraud", value: fraudAmountCount }
                  ]}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" paddingAngle={4}>
                  <Cell fill="#00e096" />
                  <Cell fill="#ff3d71" />
                </Pie>
                <Tooltip contentStyle={{ background: "#0c1120", border: "1px solid #1e2d4a", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00e096" }} /> Legitimate
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3d71" }} /> Fraud
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">⊡ Decision Threshold Tuner</div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
          Drag the slider to change the fraud decision threshold. Lower → catch more fraud (higher recall). Higher → fewer false alarms (higher precision).
        </p>
        <div className="slider-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>0.0 — catch all fraud</span>
            <span style={{ fontFamily: "Space Mono", color: "var(--accent)", fontSize: "1rem" }}>{threshold}</span>
            <span>1.0 — very conservative</span>
          </div>
          <input type="range" min="0.1" max="0.9" step="0.05" value={threshold}
            onChange={e => handleThreshold(parseFloat(e.target.value))} />
        </div>
        {thresholdResult && (
          <div className="stats-grid" style={{ marginTop: 16 }}>
            {[
              { label: "Precision", value: thresholdResult.precision, sub: "of fraud alerts are real" },
              { label: "Recall", value: thresholdResult.recall, sub: "of fraud cases caught" },
              { label: "F1 Score", value: thresholdResult.f1, sub: "harmonic mean" },
              { label: "Fraud Caught", value: thresholdResult.true_positives, sub: "true positives" },
              { label: "False Alarms", value: thresholdResult.false_positives, sub: "false positives" },
              { label: "Missed Fraud", value: thresholdResult.false_negatives, sub: "false negatives" },
            ].map(({ label, value, sub }) => (
              <div className="stat-card" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ fontSize: "1.4rem" }}>{value}</div>
                <div className="stat-sub">{sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
