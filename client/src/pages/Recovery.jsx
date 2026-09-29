import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as auth from '../services/authService.js';
import { useToast } from '../context/ToastContext.jsx';
import { isEmail, validateField } from '../utils/validation.js';
import { ErrorMessage } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';

// One component for /forgot-password, /verify-otp and /reset-password (state passed via router).
export default function Recovery({ step }) {
  const nav = useNavigate();
  const toast = useToast();
  const st = useLocation().state || {};
  const [email, setEmail] = useState(st.email || '');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState({ password: '', confirmPassword: '' });
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => { setBusy(true); setMsg(''); setErrs({}); try { await fn(); } catch (x) { setMsg(x.message); setErrs(x.fields || {}); } finally { setBusy(false); } };

  const sendOtp = (e) => { e.preventDefault(); if (!isEmail(email.trim().toLowerCase())) return setErrs({ email: 'Please enter a valid email address.' });
    run(async () => { await auth.forgotPassword(email.trim()); toast.success('If the email is registered, a code has been sent.'); nav('/verify-otp', { state: { email: email.trim() } }); }); };
  const verify = (e) => { e.preventDefault(); if (!/^\d{6}$/.test(otp)) return setErrs({ otp: 'Enter the 6-digit code.' });
    run(async () => { const r = await auth.verifyOtp(email, otp); nav('/reset-password', { state: { resetToken: r.data.resetToken } }); }); };
  const reset = (e) => { e.preventDefault();
    const er = { password: validateField('password', pw.password), confirmPassword: validateField('confirmPassword', pw.confirmPassword, pw) };
    if (er.password || er.confirmPassword) return setErrs(er);
    run(async () => { await auth.resetPassword({ resetToken: st.resetToken, ...pw }); toast.success('Password reset successful. Please login.'); nav('/login'); }); };

  const titles = { email: ['Forgot password?', "Enter your email and we'll send a 6-digit code."], otp: ['Verify your email', `Enter the code sent to ${email || 'your email'}. It expires in 5 minutes.`], reset: ['Set a new password', 'Choose a strong password for your account.'] };
  if (step === 'otp' && !email) return nav('/forgot-password', { replace: true }) || null;
  if (step === 'reset' && !st.resetToken) return nav('/forgot-password', { replace: true }) || null;
  return (
    <div className="container-x py-16 grid place-items-center">
      <form onSubmit={{ email: sendOtp, otp: verify, reset }[step]} noValidate className="card w-full max-w-md p-8 space-y-5 animate-fadeUp">
        <div><h1 className="text-3xl mb-1">{titles[step][0]}</h1><p className="text-sm text-ink/60">{titles[step][1]}</p></div>
        <ErrorMessage message={msg} />
        {step === 'email' && <Field label="Email" name="email" error={errs.email}><input id="email" type="email" className={cls(errs.email)} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>}
        {step === 'otp' && <Field label="6-digit code" name="otp" error={errs.otp}><input id="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className={cls(errs.otp) + ' text-center text-2xl tracking-[0.5em]'} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} /></Field>}
        {step === 'reset' && <>
          <Field label="New Password" name="password" error={errs.password}><PasswordInput name="password" value={pw.password} error={errs.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" /></Field>
          <PasswordStrength password={pw.password} />
          <Field label="Confirm Password" name="confirmPassword" error={errs.confirmPassword}><PasswordInput name="confirmPassword" value={pw.confirmPassword} error={errs.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" /></Field></>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? { email: 'Sending OTP...', otp: 'Verifying OTP...', reset: 'Resetting password...' }[step] : { email: 'Send OTP', otp: 'Verify', reset: 'Reset Password' }[step]}</button>
        {step !== 'email' && <p className="text-center text-sm"><Link className="text-rose" to="/forgot-password">Request a new code</Link></p>}
        <p className="text-center text-sm"><Link className="text-ink/60 hover:text-rose" to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
