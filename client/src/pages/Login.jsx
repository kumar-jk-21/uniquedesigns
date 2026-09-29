import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as auth from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';

export default function Login() {
  const { setSession } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const [f, setF] = useState({ identifier: '', password: '' });
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    const er = {};
    if (!f.identifier.trim()) er.identifier = 'Please enter your email or mobile number.';
    if (!f.password) er.password = 'Please enter your password.';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { const r = await auth.login(f.identifier.trim(), f.password); setSession(r.data); toast.success('Welcome back!'); nav(from, { replace: true }); }
    catch (x) { setMsg(x.message); setErrs(x.fields || {}); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-rose-soft via-cream to-sand p-4">
      <form onSubmit={submit} noValidate className="card w-full max-w-md p-8 space-y-5 animate-fadeUp">
        <Link to="/" className="block text-center font-display text-2xl tracking-[0.18em]">UNIQUE <span className="text-rose">DESIGNS</span></Link>
        <h1 className="text-3xl text-center">Welcome back</h1>
        <ErrorMessage message={msg} />
        <Field label="Email or Mobile" name="identifier" error={errs.identifier}><input id="identifier" className={cls(errs.identifier)} autoComplete="username" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} /></Field>
        <Field label="Password" name="password" error={errs.password}><PasswordInput name="password" value={f.password} autoComplete="current-password" error={errs.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <div className="text-right text-sm"><Link to="/forgot-password" className="text-rose hover:underline">Forgot password?</Link></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Login'}</button>
        <p className="text-center text-sm">New here? <Link to="/register" className="text-rose font-medium">Create an account</Link></p>
      </form>
    </div>
  );
}
