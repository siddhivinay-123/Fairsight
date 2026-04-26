import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      return setError("Please enter email and password");
    }

    try {
      setError('');
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError('Failed to log in or create an account. ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-6 bg-grid-black/[0.05] dark:bg-grid-white/[0.05]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-md p-8 page-enter"
      >
        <div className="text-center mb-8">
          <div className="text-accent font-display text-2xl font-bold tracking-tight glow-cyan mx-auto">
            FAIR<span className="text-neon">SIGHT</span>
          </div>
          <div className="text-muted text-xs font-mono mt-1">Responsible AI Platform</div>
        </div>

        <h2 className="text-xl font-body font-medium text-soft mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {error && (
          <div className="bg-danger/20 text-danger border border-danger/30 p-3 rounded mb-4 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted font-mono mb-1.5">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cyber-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-muted font-mono mb-1.5">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input w-full"
            />
          </div>
          <button 
            disabled={loading} 
            className="btn-neon w-full py-3 mt-4 disabled:opacity-50"
            type="submit"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'LOG IN →' : 'SIGN UP →')}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono text-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:underline ml-1 glow-cyan"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
