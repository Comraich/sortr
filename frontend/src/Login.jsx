import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for token in URL (from OAuth redirect)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegistering ? '/api/register' : '/api/login';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setIsRegistering(false);
          setError('Registration successful! Please log in.');
        } else {
          localStorage.setItem('token', data.token);
          navigate('/');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Failed to connect to server');
    }
  };

  return (
    <section className="card form-section" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="form-actions" style={{ flexDirection: 'column' }}>
          <button type="submit" className="btn-primary">
            {isRegistering ? 'Create Account' : 'Login'}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
        
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Or sign in with</p>
          <button type="button" className="btn-secondary" style={{ width: '100%', backgroundColor: '#db4437', color: 'white' }} onClick={() => window.location.href = `${API_URL}/auth/google`}>
            Google
          </button>
          <button type="button" className="btn-secondary" style={{ width: '100%', backgroundColor: '#333', color: 'white', marginTop: '10px' }} onClick={() => window.location.href = `${API_URL}/auth/github`}>
            GitHub
          </button>
          <button type="button" className="btn-secondary" style={{ width: '100%', backgroundColor: '#0078d4', color: 'white', marginTop: '10px' }} onClick={() => window.location.href = `${API_URL}/auth/microsoft`}>
            Microsoft
          </button>
        </div>

      </form>
    </section>
  );
}

export default Login;