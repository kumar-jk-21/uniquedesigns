import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout, isSuperAdmin } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [['dashboard', 'Dashboard'], ['products', 'Products'], ['categories', 'Categories'], ['users', 'Users'], ...(isSuperAdmin ? [['admins', 'Admins']] : []), ['profile', 'My Profile']];
  const cls = ({ isActive }) => `block rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-rose text-white' : 'text-white/70 hover:bg-white/10'}`;
  return (
    <div className="min-h-screen bg-[#f6f3ef] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className={`${open ? 'block' : 'hidden'} lg:block bg-ink p-5 lg:sticky lg:top-0 lg:h-screen`}>
        <p className="font-display text-xl tracking-[0.2em] text-white mb-1">UNIQUE</p><p className="text-xs text-gold tracking-widest mb-8">ADMIN PANEL</p>
        <nav className="space-y-1">{links.map(([to, l]) => <NavLink key={to} to={`/admin/${to}`} className={cls} onClick={() => setOpen(false)}>{l}</NavLink>)}</nav>
        <button onClick={async () => { await logout(); nav('/admin/login'); }} className="mt-8 text-sm text-white/60 hover:text-white px-4">Logout</button>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between bg-white border-b border-sand px-4 sm:px-8 h-14">
          <button className="lg:hidden text-xl min-h-[44px] px-2" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
          <p className="text-sm ml-auto">{user.fullName} <span className="ml-2 rounded-full bg-rose-soft text-rose px-2 py-0.5 text-xs">{user.role.replace('_', ' ')}</span></p>
        </header>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
