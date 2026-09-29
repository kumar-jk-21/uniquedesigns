import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, wishCount } = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const link = ({ isActive }) => `py-2 hover:text-rose transition ${isActive ? 'text-rose' : ''}`;
  const go = (e) => { e.preventDefault(); nav(`/products?q=${encodeURIComponent(q.trim())}`); setOpen(false); };
  const items = [['/', 'Home'], ['/products?audience=WOMEN', 'Women'], ['/products?audience=GIRLS', 'Girls'], ['/products?audience=CHILD_GIRLS', 'Child Girls'], ['/products', 'Categories']];
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-sand">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link to="/" className="font-display text-xl sm:text-2xl tracking-[0.18em] whitespace-nowrap">UNIQUE <span className="text-rose">DESIGNS</span></Link>
        <nav className="hidden lg:flex gap-6 text-sm">{items.map(([to, l]) => <NavLink key={l} to={to} end={to === '/'} className={link}>{l}</NavLink>)}</nav>
        <form onSubmit={go} className="hidden md:block flex-1 max-w-xs" role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dresses, sarees…" aria-label="Search products" className="input !rounded-full !min-h-[38px]" />
        </form>
        <div className="flex items-center gap-1 text-sm">
          <Link to="/user/wishlist" className="relative px-2 min-h-[44px] grid place-items-center" aria-label="Wishlist">♡{wishCount > 0 && <span className="absolute top-1 right-0 rounded-full bg-rose text-white text-[10px] px-1.5">{wishCount}</span>}</Link>
          <Link to="/user/cart" className="relative px-2 min-h-[44px] grid place-items-center" aria-label="Cart">🛍{cartCount > 0 && <span className="absolute top-1 right-0 rounded-full bg-rose text-white text-[10px] px-1.5">{cartCount}</span>}</Link>
          {user ? (
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Link to={user.role === 'USER' ? '/user/dashboard' : '/admin/dashboard'} className="btn-outline !px-4">{user.fullName.split(' ')[0]}</Link>
              <button onClick={async () => { await logout(); nav('/'); }} className="text-ink/60 hover:text-rose px-2">Logout</button>
            </div>
          ) : <Link to="/login" className="hidden sm:inline-flex btn-primary ml-2 !px-5">Login</Link>}
          <button className="lg:hidden px-3 min-h-[44px] text-xl" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-sand bg-cream px-4 pb-4 animate-fadeUp">
          <form onSubmit={go} className="py-3"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search products" className="input" /></form>
          <nav className="flex flex-col text-base">{items.map(([to, l]) => <NavLink key={l} to={to} onClick={() => setOpen(false)} className={link}>{l}</NavLink>)}
            {user ? <><Link to="/user/dashboard" onClick={() => setOpen(false)} className="py-2">My Account</Link><button onClick={async () => { await logout(); setOpen(false); nav('/'); }} className="py-2 text-left">Logout</button></>
              : <Link to="/login" onClick={() => setOpen(false)} className="py-2 font-medium text-rose">Login / Register</Link>}</nav>
        </div>
      )}
    </header>
  );
}
