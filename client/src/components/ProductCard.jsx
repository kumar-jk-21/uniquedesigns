import { Link, useNavigate } from 'react-router-dom';
import { imgUrl } from '../services/api.js';
import { money } from '../utils/validation.js';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const Placeholder = ({ name = '' }) => (
  <div className="h-full w-full grid place-items-center bg-gradient-to-br from-rose-soft via-sand to-cream"><span className="font-display text-5xl text-rose/60">{name.charAt(0)}</span></div>
);

export function WishlistButton({ productId, className = '' }) {
  const { wishIds, toggleWish } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const on = wishIds.has(productId);
  const click = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try { const added = await toggleWish(productId); toast.success(added ? 'Added to wishlist' : 'Removed from wishlist'); }
    catch (er) { if (er.code === 'LOGIN_REQUIRED') { toast.info(er.message); nav('/login', { state: { from: location.pathname } }); } else toast.error(er.message); }
  };
  return <button onClick={click} aria-pressed={on} aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
    className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:scale-110 transition ${on ? 'text-rose' : 'text-ink/60'} ${className}`}>{on ? '♥' : '♡'}</button>;
}

export default function ProductCard({ product: p }) {
  const img = imgUrl(p.images?.[0]?.url);
  return (
    <Link to={`/products/${p.id}`} className="group block animate-fadeUp">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
        {img ? <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <Placeholder name={p.name} />}
        {p.discountPercent > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose px-3 py-1 text-xs text-white">{Math.round(p.discountPercent)}% OFF</span>}
        {p.stock < 1 && <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-xs text-white">Out of stock</span>}
        <WishlistButton productId={p.id} className="absolute right-3 top-3" />
      </div>
      <div className="pt-3">
        <p className="text-xs uppercase tracking-wider text-ink/50">{p.category?.name}</p>
        <h3 className="font-sans text-sm font-medium truncate">{p.name}</h3>
        <p className="text-sm"><b>{money(p.finalPrice)}</b> {p.discountAmount > 0 && <s className="text-ink/40 ml-1">{money(p.price)}</s>}</p>
      </div>
    </Link>
  );
}
