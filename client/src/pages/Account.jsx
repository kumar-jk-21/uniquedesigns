import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import * as authApi from '../services/authService.js';
import { imgUrl } from '../services/api.js';
import { validateField, validateImage } from '../utils/validation.js';
import { ErrorMessage } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { DistrictDropdown, PincodeInput, StateDropdown } from '../components/LocationFields.jsx';

export const Avatar = ({ user, size = 'h-20 w-20' }) => (
  <div className={`${size} rounded-full overflow-hidden bg-rose-soft grid place-items-center font-display text-2xl text-rose`}>
    {user.profileImage ? <img src={imgUrl(user.profileImage)} alt={user.fullName} className="h-full w-full object-cover" /> : user.fullName.charAt(0)}</div>
);
const Row = ({ k, v }) => <div className="flex justify-between gap-4 py-2.5 border-b border-sand text-sm"><span className="text-ink/60">{k}</span><span className="text-right">{v}</span></div>;

export function ProfileView({ user, editTo }) {
  return (<div className="card p-6 space-y-1"><div className="flex items-center gap-4 mb-4"><Avatar user={user} /><div><h2 className="text-2xl">{user.fullName}</h2><p className="text-sm text-ink/60">{user.email}</p></div></div>
    <Row k="Mobile" v={user.mobileNumber} /><Row k="Date of birth" v={new Date(user.dateOfBirth).toLocaleDateString('en-IN')} />
    <Row k="Address" v={`${user.doorNumber}, ${user.streetName}, ${user.address}`} /><Row k="District / State" v={`${user.district}, ${user.state}`} /><Row k="Pincode" v={user.pincode} />
    {editTo && <div className="pt-4"><Link to={editTo} className="btn-primary">Edit Profile</Link></div>}</div>);
}

export function ProfileEditor({ redirect }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [v, setV] = useState({ fullName: user.fullName, mobileNumber: user.mobileNumber, email: user.email, dateOfBirth: user.dateOfBirth.slice(0, 10), doorNumber: user.doorNumber, streetName: user.streetName, address: user.address, state: user.state, district: user.district, pincode: user.pincode });
  const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }); const [pwErrs, setPwErrs] = useState({}); const [pwBusy, setPwBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const on = (e) => { const { name, value } = e.target; setV((s) => ({ ...s, [name]: value, ...(name === 'state' ? { district: '' } : {}) })); setErrs((s) => ({ ...s, [name]: '' })); };
  const blur = (e) => setErrs((s) => ({ ...s, [e.target.name]: validateField(e.target.name, v[e.target.name], v) }));
  const save = async (e) => {
    e.preventDefault();
    const er = Object.fromEntries(Object.keys(v).map((k) => [k, validateField(k, v[k], v)]).filter(([, m]) => m));
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true); setMsg('');
    try { const r = await authApi.updateProfile(v); setUser(r.data.user); toast.success('Profile updated'); nav(redirect); } catch (x) { setMsg(x.message); setErrs(x.fields || {}); } finally { setBusy(false); }
  };
  const image = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    const m = await validateImage(f); if (m) return toast.error(m);
    setImgBusy(true); const fd = new FormData(); fd.append('profileImage', f);
    try { const r = await authApi.updateProfileImage(fd); setUser(r.data.user); toast.success('Profile image updated'); } catch (x) { toast.error(x.message); } finally { setImgBusy(false); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    const er = { currentPassword: pw.currentPassword ? '' : 'Enter your current password.', newPassword: validateField('password', pw.newPassword), confirmPassword: validateField('confirmPassword', pw.confirmPassword, { password: pw.newPassword }) };
    setPwErrs(er); if (Object.values(er).some(Boolean)) return;
    setPwBusy(true);
    try { await authApi.changePassword(pw); toast.success('Password updated'); setPw({ currentPassword: '', newPassword: '', confirmPassword: '' }); } catch (x) { setPwErrs(x.fields || { currentPassword: x.message }); } finally { setPwBusy(false); }
  };
  const F = (n, label, extra = {}) => <Field label={label} name={n} required error={errs[n]}><input id={n} name={n} value={v[n]} onChange={on} onBlur={blur} className={cls(errs[n])} {...extra} /></Field>;
  return (
    <div className="space-y-8">
      <div className="card p-6 flex items-center gap-4"><Avatar user={user} /><label className="btn-outline cursor-pointer">{imgBusy ? 'Uploading image...' : 'Change photo'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={image} disabled={imgBusy} /></label></div>
      <form onSubmit={save} noValidate className="card p-6 space-y-4"><h2 className="text-xl">Personal details</h2><ErrorMessage message={msg} />
        {F('fullName', 'Full Name')}{F('mobileNumber', 'Mobile Number', { inputMode: 'tel' })}{F('email', 'Email', { type: 'email' })}{F('dateOfBirth', 'Date of Birth', { type: 'date' })}
        <div className="grid grid-cols-2 gap-4">{F('doorNumber', 'Door Number')}{F('streetName', 'Street Name')}</div>{F('address', 'Address')}
        <StateDropdown value={v.state} onChange={on} onBlur={blur} error={errs.state} /><DistrictDropdown state={v.state} value={v.district} onChange={on} onBlur={blur} error={errs.district} /><PincodeInput value={v.pincode} onChange={on} onBlur={blur} error={errs.pincode} />
        <button className="btn-primary" disabled={busy}>{busy ? 'Updating profile...' : 'Save changes'}</button></form>
      <form onSubmit={changePw} noValidate className="card p-6 space-y-4"><h2 className="text-xl">Change password</h2>
        <Field label="Current Password" name="currentPassword" error={pwErrs.currentPassword}><PasswordInput name="currentPassword" value={pw.currentPassword} error={pwErrs.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
        <Field label="New Password" name="newPassword" error={pwErrs.newPassword}><PasswordInput name="newPassword" value={pw.newPassword} error={pwErrs.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field><PasswordStrength password={pw.newPassword} />
        <Field label="Confirm New Password" name="confirmPassword" error={pwErrs.confirmPassword}><PasswordInput name="confirmPassword" value={pw.confirmPassword} error={pwErrs.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" /></Field>
        <button className="btn-primary" disabled={pwBusy}>{pwBusy ? 'Updating...' : 'Update password'}</button></form>
    </div>
  );
}

export default function Account({ view }) {
  const { user } = useAuth();
  const { cartCount, wishCount } = useStore();
  return (
    <div className="container-x py-8 max-w-3xl">
      <div className="flex gap-4 text-sm mb-6 border-b border-sand">{[['/user/dashboard', 'Dashboard'], ['/user/profile', 'Profile'], ['/user/wishlist', 'Wishlist'], ['/user/cart', 'Bag']].map(([to, l]) => <Link key={to} to={to} className="py-3 hover:text-rose">{l}</Link>)}</div>
      {view === 'dashboard' && <div className="space-y-6"><h1 className="text-3xl">Hello, {user.fullName.split(' ')[0]} ✦</h1>
        <div className="grid grid-cols-2 gap-4"><Link to="/user/wishlist" className="card p-6 hover:border-rose"><p className="text-3xl font-display">{wishCount}</p><p className="text-sm text-ink/60">Wishlist items</p></Link><Link to="/user/cart" className="card p-6 hover:border-rose"><p className="text-3xl font-display">{cartCount}</p><p className="text-sm text-ink/60">Items in bag</p></Link></div>
        <ProfileView user={user} editTo="/user/profile/edit" /></div>}
      {view === 'profile' && <ProfileView user={user} editTo="/user/profile/edit" />}
      {view === 'edit' && <ProfileEditor redirect="/user/profile" />}
    </div>
  );
}
