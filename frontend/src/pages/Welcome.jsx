import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <>
      {/* This embedded style block completely bypasses index.css 
        and FORCES the fonts to load on this specific page.
      */}
      <style>{`
        .force-syne { font-family: 'Syne', sans-serif !important; }
        .force-mono { font-family: 'Space Mono', monospace !important; }
      `}</style>

      <div className="force-syne" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
        <div className="card force-syne" style={{ maxWidth: '600px', textAlign: 'center', padding: '40px' }}>
          
          <div className="force-mono" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', fontSize: '2.5rem', fontWeight: '700', color: '#38bdf8' }}>
            <div>⬡</div>
            <span>FraudLens</span>
          </div>
          
          <h1 style={{ marginBottom: '16px', fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>
            Welcome to FraudLens
          </h1>
          
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px', color: 'var(--text-muted)' }}>
            An advanced, machine-learning powered platform designed to detect and prevent credit card fraud in real-time. Secure your transactions with state-of-the-art predictive analytics.
          </p>
          
          <button 
            className="btn-primary force-syne" 
            onClick={() => navigate('/login')}
            style={{ width: 'auto', padding: '16px 48px', fontSize: '1.1rem' }}
          >
            Get Started
          </button>
          
        </div>
      </div>
    </>
  );
}