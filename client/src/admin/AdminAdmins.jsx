import { useState } from 'react';
import { createAdmin, getAdmins, setAdminStatus } from '../services/adminService.js';
import { useToast } from '../context/ToastContext.jsx';
import { validateField } from '../utils/validation.js';
import { ConfirmationModal, EmptyState, ErrorMessage, ErrorState, Loader, Pagination } from '../components/ui.jsx';
import { Field, PasswordInput, cls } from '../components/FormField.jsx';
import { DistrictDropdown, PincodeInput, StateDropdown } from '../components/LocationFields.jsx';
import { AccountTable, usePagedAccounts } from './AdminUsers.jsx';

const INIT = { fullName: '', mobileNumber: '', email: '', dateOfBirth: '', doorNumber: '', streetName: '', address: '', state: '', district: '', pincode: '', password: '' };

export default function AdminAdmins() {
  const toast = useToast();
  const s = usePagedAccounts(getAdmins, setAdminStatus);
  const [open, setOpen] = useState(false); const [v, setV] = useState(INIT); const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const on = (e) => { const { name, value } = e.target; setV((x) => ({ ...x, [name]: value, ...(name === 'state' ? { district: '' } : {}) })); setErrs((x) => ({ ...x, [name]: '' })); };
  const blur = (e) => setErrs((x) => ({ ...x, [e.target.name]: validateField(e.target.name, v[e.target.name], v) }));
  const submit = async (e) => {
    e.preventDefault();
    const er = Object.fromEntries(Object.keys(v).map((k) => [k, validateField(k, v[k], v)]).filter(([, m]) => m));
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true); setMsg('');
    try { await createAdmin(v); toast.success('Admin created'); setV(INIT); setOpen(false); s.reload(); } catch (x) { setMsg(x.message); setErrs(x.fields || {}); } finally { setBusy(false); }
  };
  const F = (n, label, extra = {}) => <Field label={label} name={n} required error={errs[n]}><input id={n} name={n} value={v[n]} onChange={on} onBlur={blur} className={cls(errs[n])} {...extra} /></Field>;
  return (
    <div className="space-y-6"><div className="flex flex-wrap gap-3 items-center"><h1 className="text-3xl mr-auto">Admins</h1><button className="btn-primary" onClick={() => setOpen(!open)}>{open ? 'Close' : '+ Create Admin'}</button></div>
      {open && <form onSubmit={submit} noValidate className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl animate-fadeUp"><div className="sm:col-span-2"><ErrorMessage message={msg} /></div>
        {F('fullName', 'Full Name')}{F('mobileNumber', 'Mobile Number', { inputMode: 'tel' })}{F('email', 'Email', { type: 'email' })}{F('dateOfBirth', 'Date of Birth', { type: 'date' })}
        {F('doorNumber', 'Door Number')}{F('streetName', 'Street Name')}<div className="sm:col-span-2">{F('address', 'Address')}</div>
        <StateDropdown value={v.state} onChange={on} onBlur={blur} error={errs.state} /><DistrictDropdown state={v.state} value={v.district} onChange={on} onBlur={blur} error={errs.district} /><PincodeInput value={v.pincode} onChange={on} onBlur={blur} error={errs.pincode} />
        <Field label="Temporary Password" name="password" required error={errs.password}><PasswordInput name="password" value={v.password} onChange={on} onBlur={blur} error={errs.password} autoComplete="new-password" /></Field>
        <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create admin'}</button></div></form>}
      {s.loading ? <Loader /> : s.error ? <ErrorState error={s.error} onRetry={s.reload} /> : !s.data.users.length ? <EmptyState title="No admins" text="Create an admin above." /> : <AccountTable users={s.data.users} onToggle={s.setTarget} />}
      <Pagination meta={s.meta} onPage={s.setPage} />
      <ConfirmationModal open={!!s.target} busy={s.busy} danger={s.target?.isActive} title={s.target?.isActive ? 'Deactivate admin?' : 'Activate admin?'} message={`${s.target?.fullName} (${s.target?.email})`} onConfirm={s.confirm} onCancel={() => s.setTarget(null)} confirmLabel="Confirm" />
    </div>
  );
}
