import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import * as auth from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';

export default function AdminLogin() {
  const { user, setSession } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ identifier: '', password: '' });
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  if (user && user.role !== 'USER') return <Navigate to="/admin/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (!f.identifier.trim() || !f.password) return setMsg('Please enter your email and password.');
    setBusy(true); setMsg('');
    try { const r = await auth.adminLogin(f.identifier.trim(), f.password); setSession(r.data); nav('/admin/dashboard'); } catch (x) { setMsg(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-ink p-4">
      <form onSubmit={submit} noValidate className="w-full max-w-sm rounded-3xl bg-white p-8 space-y-5">
        <div className="text-center"><p className="font-display text-2xl tracking-[0.2em]">UNIQUE</p><p className="text-xs text-gold tracking-widest">ADMIN PANEL</p></div>
        <ErrorMessage message={msg} />
        <Field label="Email" name="identifier"><input id="identifier" className={cls()} value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoComplete="username" /></Field>
        <Field label="Password" name="password"><PasswordInput name="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  );
}
