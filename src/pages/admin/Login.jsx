import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.token) {
        login(result.token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        alert('Login failed');
      }
    } catch (err) {
      alert('Error');
    }
  };

  return (
    <div className="page-fill min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="panel p-8 md:p-10 rounded-3xl max-w-md w-full border-delivery-100 shadow-lift">
        <p className="text-xs font-bold uppercase text-delivery-700 tracking-[0.2em] text-center mb-2">
          Staff access
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 text-center mb-8">
          Owner dashboard
        </h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              className="input-field min-h-[48px]"
              defaultValue="owner@genz.com"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              className="input-field min-h-[48px]"
              defaultValue="genz123"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="w-full btn-primary py-3.5 text-lg rounded-xl mt-2">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
