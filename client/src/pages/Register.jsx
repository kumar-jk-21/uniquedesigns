import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as auth from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateField, validateImage, normalizeMobile } from '../utils/validation.js';
import { ErrorMessage } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { DistrictDropdown, PincodeInput, StateDropdown } from '../components/LocationFields.jsx';

const STEPS = [
  ['Personal', ['fullName', 'mobileNumber', 'dateOfBirth', 'email']],
  ['Address', ['doorNumber', 'streetName', 'address', 'state', 'district', 'pincode']],
  ['Security', ['password', 'confirmPassword']]
];
const INIT = { fullName: '', mobileNumber: '', dateOfBirth: '', email: '', doorNumber: '', streetName: '', address: '', state: '', district: '', pincode: '', password: '', confirmPassword: '' };

export default function Register() {
  const { setSession } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [v, setV] = useState(INIT);
  const [touched, setTouched] = useState({});
  const [serverErrs, setServerErrs] = useState({});
  const [imgFile, setImgFile] = useState(null);
  const [imgErr, setImgErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);
  const preview = useMemo(() => (imgFile ? URL.createObjectURL(imgFile) : null), [imgFile]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const errOf = (n) => serverErrs[n] || (touched[n] ? validateField(n, v[n], v) : '');
  const setField = (name, value) => {
    setV((s) => {
      const n = { ...s, [name]: value };
      if (name === 'state') n.district = ''; // changing state clears district
      return n;
    });
    setServerErrs((s) => ({ ...s, [name]: undefined }));
    if (name === 'state') setTouched((t) => ({ ...t, district: false }));
    if (name === 'password') setTouched((t) => ({ ...t, ...(v.confirmPassword ? { confirmPassword: true } : {}) }));
  };
  const on = (e) => setField(e.target.name, e.target.value);
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));
  const ok = (n) => v[n] && !validateField(n, v[n], v);
  const props = (n) => ({ name: n, id: n, value: v[n], onChange: on, onBlur: blur, 'aria-invalid': !!errOf(n), 'aria-describedby': errOf(n) ? `${n}-err` : undefined, className: cls(errOf(n), ok(n)) });

  const pickImage = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    const m = await validateImage(f);
    setImgErr(m); setImgFile(m ? null : f);
  };
  const stepValid = (i) => STEPS[i][1].every((n) => !validateField(n, v[n], v));
  const touchStep = (i) => setTouched((t) => ({ ...t, ...Object.fromEntries(STEPS[i][1].map((n) => [n, true])) }));
  const next = () => { touchStep(step); if (stepValid(step)) setStep(step + 1); };

  const submit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < STEPS.length; i++) if (!stepValid(i)) { touchStep(i); setStep(i); return; }
    setBusy(true); setBanner(null);
    try {
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, k === 'mobileNumber' ? normalizeMobile(val) : typeof val === 'string' ? val.trim() : val));
      if (imgFile) fd.append('profileImage', imgFile);
      const r = await auth.register(fd);
      setSession(r.data);
      toast.success('✓ Account created successfully! Welcome to Unique Designs.');
      nav('/');
    } catch (x) {
      setBanner(x);
      if (x.fields && Object.keys(x.fields).length) {
        setServerErrs(x.fields);
        const bad = STEPS.findIndex(([, ns]) => ns.some((n) => x.fields[n]));
        if (bad >= 0) setStep(bad);
      }
    } finally { setBusy(false); }
  };
  const bannerMsg = banner?.code === 'DATABASE_UNAVAILABLE' ? 'We are unable to create your account right now because our database service is temporarily unavailable. Please try again later.' : banner?.message;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-[#3b2a2e] to-rose-dark p-12 text-white">
        <div className="absolute -left-16 top-1/3 h-72 w-72 rounded-full bg-rose/30 blur-3xl animate-pulse" aria-hidden />
        <div className="absolute right-10 top-24 h-40 w-40 rounded-full border border-white/20" aria-hidden />
        <Link to="/" className="relative font-display text-2xl tracking-[0.25em]">UNIQUE DESIGNS</Link>
        <div className="relative">
          <p className="text-gold tracking-[0.3em] text-xs mb-6">✦ NEW COLLECTION 2026</p>
          <h1 className="text-6xl leading-[1.05] mb-6">DEFINE<br />YOUR<br /><em className="text-rose-soft">STYLE.</em></h1>
          <p className="text-white/70 max-w-sm">Discover fashion that feels uniquely yours.</p>
        </div>
        <p className="relative text-xs text-white/50">Women · Girls · Child Girls</p>
      </aside>

      <main className="px-4 py-8 sm:px-10 lg:px-14 bg-cream">
        <form onSubmit={submit} noValidate className="mx-auto max-w-xl pb-24 lg:pb-0">
          <Link to="/" className="lg:hidden block font-display text-xl tracking-[0.2em] mb-6">UNIQUE <span className="text-rose">DESIGNS</span></Link>
          <h2 className="text-3xl sm:text-4xl mb-1">Create Your Account</h2>
          <p className="text-sm text-ink/60 mb-6">Already have an account? <Link to="/login" className="text-rose font-medium">Login</Link></p>

          <ol className="flex items-center mb-8" aria-label="Progress">
            {STEPS.map(([label], i) => (
              <li key={label} className="flex-1 flex items-center last:flex-none">
                <button type="button" onClick={() => i < step && setStep(i)} className="flex items-center gap-2 text-sm min-h-[44px]" aria-current={i === step ? 'step' : undefined}>
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs ${i <= step ? 'bg-rose text-white' : 'bg-sand'}`}>{i < step ? '✓' : i + 1}</span>
                  <span className={`hidden sm:inline ${i === step ? 'font-medium' : 'text-ink/50'}`}>{label}</span>
                </button>
                {i < STEPS.length - 1 && <span className={`mx-2 h-px flex-1 ${i < step ? 'bg-rose' : 'bg-sand'}`} />}
              </li>
            ))}
          </ol>

          <div className="card p-5 sm:p-7 space-y-5 animate-fadeUp" key={step}>
            <ErrorMessage message={bannerMsg} />
            {step === 0 && <>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-sand grid place-items-center text-2xl text-rose/60 shrink-0">{preview ? <img src={preview} alt="Profile preview" className="h-full w-full object-cover" /> : '👤'}</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile Image <span className="text-ink/40 font-normal">(optional)</span></p>
                  <label className="btn-outline !min-h-[36px] cursor-pointer text-xs">{imgFile ? 'Change' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickImage} /></label>
                  {imgFile && <button type="button" onClick={() => setImgFile(null)} className="ml-2 text-xs text-red-600">Remove</button>}
                  {imgErr && <p role="alert" className="text-xs text-red-600">⚠ {imgErr}</p>}
                </div>
              </div>
              <Field label="Full Name" name="fullName" required error={errOf('fullName')} valid={ok('fullName')}><input {...props('fullName')} autoComplete="name" /></Field>
              <Field label="Mobile Number" name="mobileNumber" required error={errOf('mobileNumber')} valid={ok('mobileNumber')}><input {...props('mobileNumber')} inputMode="tel" autoComplete="tel" maxLength={14} placeholder="10-digit number" onChange={(e) => setField('mobileNumber', e.target.value.replace(/[^\d+\s-]/g, ''))} /></Field>
              <Field label="Date of Birth" name="dateOfBirth" required error={errOf('dateOfBirth')} valid={ok('dateOfBirth')}><input {...props('dateOfBirth')} type="date" max={new Date().toISOString().slice(0, 10)} autoComplete="bday" /></Field>
              <Field label="Email" name="email" required error={errOf('email')} valid={ok('email')}><input {...props('email')} type="email" autoComplete="email" /></Field>
            </>}
            {step === 1 && <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Door Number" name="doorNumber" required error={errOf('doorNumber')} valid={ok('doorNumber')}><input {...props('doorNumber')} /></Field>
                <Field label="Street Name" name="streetName" required error={errOf('streetName')} valid={ok('streetName')}><input {...props('streetName')} /></Field>
              </div>
              <Field label="Address" name="address" required error={errOf('address')} valid={ok('address')}><textarea {...props('address')} rows={2} className={cls(errOf('address'), false) + ' py-3'} /></Field>
              <StateDropdown value={v.state} onChange={on} onBlur={blur} error={errOf('state')} />
              <DistrictDropdown state={v.state} value={v.district} onChange={on} onBlur={blur} error={errOf('district')} />
              <PincodeInput value={v.pincode} onChange={on} onBlur={blur} error={errOf('pincode')} />
            </>}
            {step === 2 && <>
              <Field label="Password" name="password" required error={errOf('password')}><PasswordInput name="password" value={v.password} onChange={on} onBlur={blur} error={errOf('password')} autoComplete="new-password" /></Field>
              <PasswordStrength password={v.password} />
              <Field label="Confirm Password" name="confirmPassword" required error={errOf('confirmPassword')}><PasswordInput name="confirmPassword" value={v.confirmPassword} onChange={on} onBlur={blur} error={errOf('confirmPassword')} autoComplete="new-password" /></Field>
            </>}
          </div>

          <div className="fixed bottom-0 inset-x-0 z-30 border-t border-sand bg-cream/95 backdrop-blur p-3 lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="mx-auto max-w-xl flex gap-3">
              {step > 0 && <button type="button" className="btn-outline" onClick={() => setStep(step - 1)} disabled={busy}>Back</button>}
              {step < STEPS.length - 1
                ? <button type="button" className="btn-primary flex-1" onClick={next}>Continue</button>
                : <button type="submit" className="btn-rose flex-1" disabled={busy || v.password !== v.confirmPassword}>{busy ? 'Creating your account...' : 'CREATE ACCOUNT'}</button>}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
