import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate('/'); 
    } else {
      setLocalError('Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setLocalError('');
    setIsSubmitting(true);
    setFormData({ email: 'at@gmail.com', password: '12345678' });

    const success = await login('demo@aiengine.dev', 'demo1234');
    if (success) {
      navigate('/');
    } else {
      setLocalError('Demo login failed. Please ensure demo account exists in database.');
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted">Password</label>
          </div>
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
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="h-px bg-border flex-1"></div>
        <span className="text-xs font-medium text-muted uppercase tracking-wider">OR</span>
        <div className="h-px bg-border flex-1"></div>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isSubmitting}
        className="w-full mt-6 border-2 border-accent/20 bg-accent/5 text-accent px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-accent/10 hover:border-accent/40 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <> <Shield className="w-4 h-4" /> Try Demo Account (1-Click) </>}
      </button>

      <div className="mt-6 text-center text-sm text-muted">
        Don't have an account? <Link to="/register" className="text-accent font-medium hover:underline">Sign up</Link>
      </div>
    </div>
  );
};