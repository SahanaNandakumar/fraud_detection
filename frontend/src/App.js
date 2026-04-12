import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Predict from "./pages/Predict";
import History from "./pages/History";
import ModelInsights from "./pages/ModelInsights";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import "./index.css";

// This layout contains your Sidebar and is only used for the main app pages
// This layout contains your Sidebar and is only used for the main app pages
function MainDashboardLayout() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Later, if you add tokens or session storage, you can clear them here:
    // localStorage.removeItem("user_token");
    
    // Redirect the user back to the Welcome page
    navigate('/'); 
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">⬡</div>
          <span>FraudLens</span>
        </div>
        <nav className="nav-links">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">▦</span> Dashboard
          </NavLink>
          <NavLink to="/predict" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">◎</span> Analyze Transaction
          </NavLink>
          <NavLink to="/insights" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">◈</span> Model Insights
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">≡</span> History
          </NavLink>
        </nav>
        
        {/* UPDATED SIDEBAR FOOTER */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="model-badge">
            <div className="badge-dot"></div>
            ML Model Active
          </div>
          
          {/* NEW SIGN OUT BUTTON */}
          <button 
            onClick={handleSignOut}
            className="nav-item"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              width: '100%', 
              textAlign: 'left', 
              cursor: 'pointer',
              color: '#ef4444', // A soft red color to indicate logging out
              marginTop: '8px'
            }}
          >
            <span className="nav-icon">⎋</span> Sign Out
          </button>
        </div>

      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/insights" element={<ModelInsights />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes without the Sidebar */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes with the Sidebar */}
        <Route path="/*" element={<MainDashboardLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
