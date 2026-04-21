import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/** No fixed `id` — same id makes react-hot-toast replace the toast instead of stacking. */
function showLoginErrorToast(message) {
  const text = message?.trim() || 'Something went wrong';
  toast.custom(
    (t) => (
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="toast-rise-from-bottom max-w-[min(90vw,22rem)] cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-slate-900 shadow-[0_0_0_1px_rgba(252,128,25,0.14),0_10px_36px_-8px_rgba(252,128,25,0.38),0_4px_14px_-2px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-delivery-400/50"
      >
        {text}
      </button>
    ),
    { duration: 5500 },
  );
}

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
      const result = await res.json().catch(() => ({}));
      if (result.success && result.token) {
        toast.dismiss();
        login(result.token);
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      const fromBody = typeof result.error === 'string' ? result.error.trim() : '';
      const msg =
        fromBody ||
        (res.status === 401 ? 'Invalid credentials' : '') ||
        (!res.ok ? `Could not sign in (${res.status})` : '') ||
        'Sign in failed';
      showLoginErrorToast(msg);
    } catch {
      showLoginErrorToast('Network error. Check your connection and try again.');
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
              defaultValue="example@gmail.com"
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
