import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
// 👇 NAYA: Zustand store import kiya
import { useAuthStore } from '../../stores/useAuthStore.js';

export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  // 👇 NAYA: Zustand store se login function nikala (auto-login ke liye)
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(
  `${import.meta.env.VITE_API_URL}/auth/register`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  }
);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto login after successful register
      const loginSuccess = await login(formData.email, formData.password);
      if (loginSuccess) navigate('/');
    } catch (error) {
      setLocalError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        {localError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{localError}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Engineer"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-primary focus:border-accent outline-none transition-colors text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="engineer@startup.ai"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-primary focus:border-accent outline-none transition-colors text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-primary focus:border-accent outline-none transition-colors text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent text-background px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Log in</Link>
      </div>
    </div>
  );
};