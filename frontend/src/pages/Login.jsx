import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // Handle typing in the input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine which backend URL to hit based on if they are logging in or registering
    const endpoint = isLogin ? "http://localhost:8000/login" : "http://localhost:8000/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (!isLogin) {
          // REGISTRATION SUCCESS: Show popup and switch to Login mode
          setNotification({ show: true, message: "Registered successfully! Please log in.", type: "success" });
          setIsLogin(true); // Switch to login screen
          setFormData({ name: '', email: '', password: '' }); // Clear form
        } else {
          // LOGIN SUCCESS: Redirect to Dashboard
          navigate('/dashboard');
        }
      } else {
        // ERROR: Show the error from the backend
        setNotification({ show: true, message: data.detail || "Something went wrong.", type: "error" });
      }
    } catch (error) {
      setNotification({ show: true, message: "Could not connect to the server.", type: "error" });
    }
    
    // Hide notification after 4 seconds
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  return (
   <div className="public-page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px', position: 'relative' }}>
        
        {/* POPUP NOTIFICATION */}
        {notification.show && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#fff',
            background: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
            boxShadow: 'var(--shadow)'
          }}>
            {notification.message}
          </div>
        )}

        <h2 className="card-title" style={{ justifyContent: 'center', fontSize: '1.5rem', marginBottom: '24px' }}>
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Enter your full name" required />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="name@company.com" required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="••••••••" required />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '24px' }}>
            {isLogin ? "Sign In" : "Register"}
          </button>
          
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            className="btn-secondary" 
            style={{ border: 'none', background: 'transparent', width: 'auto', padding: '8px' }}
            onClick={() => { setIsLogin(!isLogin); setNotification({show: false, message: '', type: ''}); }}
            type="button"
          >
            {isLogin ? "Need an account? Register here." : "Already have an account? Log in."}
          </button>
        </div>

      </div>
    </div>
  );
}