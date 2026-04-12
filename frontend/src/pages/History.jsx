import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | fraud | legit

  useEffect(() => {
    fetch(`${API}/history?limit=200`)
      .then(r => r.json())
      .then(d => { setHistory(d.predictions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading history...</span></div>;

  const filtered = history.filter(p => {
    if (filter === "fraud") return p.is_fraud;
    if (filter === "legit") return !p.is_fraud;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prediction History</h1>
        <p className="page-subtitle">All transactions analyzed — stored in MongoDB</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "fraud", "legit"].map(f => (
          <button key={f} className="btn-secondary"
            style={filter === f ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "fraud" ? "⚠ Fraud Only" : "✓ Legit Only"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)", alignSelf: "center" }}>
          {filtered.length} records
        </span>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No predictions yet</h3>
            <p>Analyze a transaction from the Predict page to see history here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Amount</th>
                <th>Risk Score</th>
                <th>Probability</th>
                <th>Risk Level</th>
                <th>Threshold</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {new Date(p.timestamp).toLocaleString()}
                  </td>
                  <td>${p.amount?.toFixed(2) ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 50, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${p.risk_score}%`, height: "100%",
                          background: p.risk_score > 60 ? "var(--danger)" : p.risk_score > 30 ? "var(--warning)" : "var(--success)",
                          borderRadius: 2
                        }} />
                      </div>
                      {p.risk_score}%
                    </div>
                  </td>
                  <td>{(p.probability * 100).toFixed(2)}%</td>
                  <td>
                    <span className={`risk-level-badge risk-${p.risk_level}`}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{p.threshold_used}</td>
                  <td style={{
                    color: p.is_fraud ? "var(--danger)" : "var(--success)",
                    fontWeight: 700
                  }}>
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