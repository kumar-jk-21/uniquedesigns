import { useState } from 'react';
import useFetch, { useDebounce } from '../hooks/useFetch.js';
import { getUsers, setUserStatus } from '../services/adminService.js';
import { imgUrl } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { ConfirmationModal, EmptyState, ErrorState, Loader, Pagination } from '../components/ui.jsx';

export function AccountTable({ users, onToggle }) {
  return (
    <div className="card overflow-x-auto"><table className="w-full text-sm min-w-[900px]"><thead className="text-left text-ink/60 border-b border-sand"><tr>{['User', 'Mobile', 'DOB', 'Address', 'Location', 'Registered', 'Status', ''].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-sand">{users.map((u) => (
        <tr key={u.id}><td className="p-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-rose-soft overflow-hidden grid place-items-center text-rose shrink-0">{u.profileImage ? <img src={imgUrl(u.profileImage)} alt="" className="h-full w-full object-cover" /> : u.fullName[0]}</div><div><p className="font-medium">{u.fullName}</p><p className="text-xs text-ink/50">{u.email}{u.role !== 'USER' && ` · ${u.role.replace('_', ' ')}`}</p></div></div></td>
          <td className="p-3">{u.mobileNumber}</td><td className="p-3">{new Date(u.dateOfBirth).toLocaleDateString('en-IN')}</td>
          <td className="p-3 max-w-[220px]">{u.doorNumber}, {u.streetName}, {u.address}</td><td className="p-3">{u.district}, {u.state} – {u.pincode}</td>
          <td className="p-3">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
          <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
          <td className="p-3">{u.role !== 'SUPER_ADMIN' && <button className={u.isActive ? 'text-red-600' : 'text-emerald-700'} onClick={() => onToggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td></tr>))}</tbody></table></div>
  );
}

export function usePagedAccounts(fetcher, setter) {
  const toast = useToast();
  const [page, setPage] = useState(1); const [q, setQ] = useState(''); const dq = useDebounce(q);
  const [target, setTarget] = useState(null); const [busy, setBusy] = useState(false);
  const res = useFetch(() => fetcher({ page, q: dq, limit: 10 }), [page, dq]);
  const confirm = async () => {
    setBusy(true);
    try { await setter(target.id, !target.isActive); toast.success(target.isActive ? 'Account deactivated' : 'Account activated'); setTarget(null); res.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return { ...res, page, setPage, q, setQ, target, setTarget, busy, confirm };
}

export default function AdminUsers() {
  const s = usePagedAccounts(getUsers, setUserStatus);
  return (
    <div className="space-y-6"><div className="flex flex-wrap gap-3 items-center"><h1 className="text-3xl mr-auto">Users</h1><input className="input !w-full sm:!w-64" placeholder="Search name or email…" aria-label="Search users" value={s.q} onChange={(e) => { s.setQ(e.target.value); s.setPage(1); }} /></div>
      {s.loading ? <Loader /> : s.error ? <ErrorState error={s.error} onRetry={s.reload} /> : !s.data.users.length ? <EmptyState title="No users found" text="Registered customers will appear here." /> : <AccountTable users={s.data.users} onToggle={s.setTarget} />}
      <Pagination meta={s.meta} onPage={s.setPage} />
      <ConfirmationModal open={!!s.target} busy={s.busy} danger={s.target?.isActive} title={s.target?.isActive ? 'Deactivate account?' : 'Activate account?'} message={`${s.target?.fullName} (${s.target?.email})`} onConfirm={s.confirm} onCancel={() => s.setTarget(null)} confirmLabel="Confirm" />
    </div>
  );
}
