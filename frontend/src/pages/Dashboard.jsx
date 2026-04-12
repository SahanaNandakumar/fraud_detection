import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://localhost:8000";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats`).then(r => r.json()),
      fetch(`${API}/history?limit=100`).then(r => r.json())
    ]).then(([s, h]) => {
      setStats(s);
      setHistory(h.predictions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading"><div className="spinner" /><span>Loading dashboard...</span></div>
  );

  const pieData = stats ? [
    { name: "Legitimate", value: stats.legitimate },
    { name: "Fraud", value: stats.fraud_detected }
  ] : [];

  // Build trend data from history (group by last 10 predictions)
  const trendData = history.slice(0, 20).reverse().map((p, i) => ({
    name: `#${i + 1}`,
    risk: Math.round(p.risk_score || 0)
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Live overview of fraud detection activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Analyzed</div>
          <div className="stat-value">{stats?.total_predictions ?? 0}</div>
          <div className="stat-sub">transactions checked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fraud Detected</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats?.fraud_detected ?? 0}
          </div>
          <div className="stat-sub">{stats?.fraud_rate ?? 0}% fraud rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Legitimate</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats?.legitimate ?? 0}
          </div>
          <div className="stat-sub">safe transactions</div>
        </div>
       <div className="stat-card">
  <div className="stat-label">Model ROC-AUC</div>
  <div className="stat-value" style={{ color: "var(--accent)" }}>
    {stats?.model_roc_auc != null 
      ? Number(stats.model_roc_auc).toFixed(4) 
      : "—"}
  </div>
  <div className="stat-sub">{stats?.model_name}</div>
</div>
      </div>

      <div className="grid-2">
        {/* Pie chart */}
        <div className="card">
          <div className="card-title">◎ Fraud vs Legitimate</div>
          {stats?.total_predictions === 0 ? (
            <div className="empty-state">
              <h3>No data yet</h3>
              <p>Analyze a transaction to see distribution</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="value" paddingAngle={4}>
                  <Cell fill="#00e096" />
                  <Cell fill="#ff3d71" />
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0c1120", border: "1px solid #1e2d4a", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00e096" }} />
              Legitimate
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3d71" }} />
              Fraud
            </div>
          </div>
        </div>

        {/* Risk trend */}
        <div className="card">
          <div className="card-title">▲ Risk Score Trend (Last 20)</div>
          {trendData.length === 0 ? (
            <div className="empty-state">
              <h3>No data yet</h3>
              <p>Analyze transactions to see trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0c1120", border: "1px solid #1e2d4a", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="risk" stroke="#00e5ff"
                  strokeWidth={2} dot={{ fill: "#00e5ff", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-title">≡ Recent Predictions</div>
        {history.length === 0 ? (
          <div className="empty-state">
            <h3>No predictions yet</h3>
            <p>Go to Analyze Transaction to check a transaction</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Amount</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 8).map((p, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(p.timestamp).toLocaleString()}
                  </td>
                  <td>${p.amount?.toFixed(2) ?? "—"}</td>
                  <td>{p.risk_score}%</td>
                  <td>
                    <span className={`risk-level-badge risk-${p.risk_level}`}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td style={{ color: p.is_fraud ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>
                    {p.is_fraud ? "⚠ FRAUD" : "✓ SAFE"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
