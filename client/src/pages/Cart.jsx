import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { imgUrl } from '../services/api.js';
import { money } from '../utils/validation.js';
import { EmptyState, Loader } from '../components/ui.jsx';
import { Placeholder } from '../components/ProductCard.jsx';

export default function Cart() {
  const { items, summary, loading, updateQty, removeItem } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const act = async (id, fn) => { setBusyId(id); try { await fn(); } catch (e) { toast.error(e.message); } finally { setBusyId(null); } };
  if (loading && !items.length) return <Loader text="Loading your bag..." />;
  if (!items.length) return <EmptyState icon="🛍" title="Your shopping bag is empty." text="Find something you love." to="/products" cta="Start Shopping" />;
  return (
    <div className="container-x py-8 grid lg:grid-cols-[1fr_360px] gap-8">
      <div><h1 className="text-3xl mb-6">Shopping Bag</h1>
        <ul className="space-y-4">{items.map((it) => { const p = it.product; const img = imgUrl(p.images?.[0]?.url); return (
          <li key={it.id} className={`card p-3 sm:p-4 flex gap-4 ${it.available ? '' : 'opacity-60'}`}>
            <Link to={`/products/${p.id}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">{img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <Placeholder name={p.name} />}</Link>
            <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-ink/60">{[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(' · ')}</p>
              {!it.available ? <p className="text-sm text-red-600 mt-1">Currently unavailable</p> : <p className="text-sm mt-1">{money(p.finalPrice)} {p.discountAmount > 0 && <s className="text-ink/40">{money(p.price)}</s>}</p>}
              <div className="flex items-center gap-2 mt-3">
                <button aria-label="Decrease quantity" className="btn-outline !px-3 !min-h-[36px]" disabled={busyId === it.id || it.quantity <= 1} onClick={() => act(it.id, () => updateQty(it, it.quantity - 1))}>−</button>
                <span className="w-6 text-center text-sm">{it.quantity}</span>
                <button aria-label="Increase quantity" className="btn-outline !px-3 !min-h-[36px]" disabled={busyId === it.id || !it.available || it.quantity >= it.maxQuantity} onClick={() => act(it.id, () => updateQty(it, it.quantity + 1))}>+</button>
                <button className="ml-auto text-sm text-red-600 hover:underline" disabled={busyId === it.id} onClick={() => act(it.id, () => removeItem(it))}>Remove</button></div>
            </div>
            <p className="font-semibold hidden sm:block">{money(it.lineTotal)}</p>
          </li>); })}</ul></div>
      <aside className="card p-6 h-fit lg:sticky lg:top-24 space-y-3">
        <h2 className="text-xl">Order Summary</h2>
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{money(summary.subtotal)}</span></div>
        <div className="flex justify-between text-sm text-emerald-700"><span>Discount</span><span>− {money(summary.discount)}</span></div>
        <div className="flex justify-between font-semibold text-lg border-t border-sand pt-3"><span>Total</span><span>{money(summary.total)}</span></div>
        <button className="btn-primary w-full" onClick={() => (user ? toast.info('Checkout & payments are not part of this build.') : nav('/login', { state: { from: '/user/cart' } }))}>{user ? 'Proceed to Checkout' : 'Login to Checkout'}</button>
      </aside>
    </div>
  );
}
