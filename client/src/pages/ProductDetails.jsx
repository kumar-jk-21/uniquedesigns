import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import { getProduct } from '../services/productService.js';
import { imgUrl } from '../services/api.js';
import { money } from '../utils/validation.js';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ErrorPage, ErrorState, Skeleton } from '../components/ui.jsx';
import { Placeholder, WishlistButton } from '../components/ProductCard.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => getProduct(id), [id]);
  const { addToCart } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (loading) return <div className="container-x py-10 grid md:grid-cols-2 gap-8"><Skeleton className="aspect-[3/4]" /><div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-32" /></div></div>;
  if (error?.status === 404) return <ErrorPage title="Product not found" message="The requested product could not be found." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const p = data.product;
  const imgs = p.images.map((i) => imgUrl(i.url));
  const add = async (buyNow) => {
    setErr('');
    if (p.sizes.length && !size) return setErr('Please select a size.');
    if (p.colors.length && !color) return setErr('Please select a color.');
    setBusy(true);
    try { await addToCart(p, { quantity: qty, size, color }); toast.success('Added to your bag'); if (buyNow) nav('/user/cart'); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const chip = (on) => `min-w-[44px] min-h-[44px] px-3 rounded-full border text-sm ${on ? 'bg-ink text-white border-ink' : 'border-ink/25 hover:border-rose'}`;
  return (
    <div className="container-x py-8">
      <p className="text-xs text-ink/50 mb-4"><Link to="/">Home</Link> / <Link to={`/category/${p.category.slug}`}>{p.category.name}</Link> / {p.name}</p>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand cursor-zoom-in" onClick={() => imgs[idx] && setZoom(true)}>
            {imgs[idx] ? <img src={imgs[idx]} alt={`${p.name} – view ${idx + 1}`} className="h-full w-full object-cover" /> : <Placeholder name={p.name} />}
            {imgs.length > 1 && <>
              <button aria-label="Previous image" className="absolute left-3 top-1/2 h-10 w-10 rounded-full bg-white/90 shadow" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + imgs.length) % imgs.length); }}>‹</button>
              <button aria-label="Next image" className="absolute right-3 top-1/2 h-10 w-10 rounded-full bg-white/90 shadow" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % imgs.length); }}>›</button></>}
          </div>
          {imgs.length > 1 && <div className="flex gap-3 mt-3 overflow-x-auto">{imgs.map((u, i) => <button key={i} onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`} className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === idx ? 'border-rose' : 'border-transparent'}`}><img src={u} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </div>
        <div className="space-y-5">
          <div className="flex justify-between gap-4"><h1 className="text-3xl sm:text-4xl">{p.name}</h1><WishlistButton productId={p.id} className="!bg-white border border-sand shrink-0" /></div>
          <p className="text-sm text-ink/60">{p.category.name} · {p.audience.replace('_', ' ')} · ★ {p.rating.toFixed(1)}</p>
          <div className="flex items-baseline gap-3 flex-wrap"><span className="text-3xl font-semibold">{money(p.finalPrice)}</span>
            {p.discountAmount > 0 && <><s className="text-ink/40">{money(p.price)}</s><span className="text-rose text-sm">Save {money(p.discountAmount)} ({Math.round(p.discountPercent)}% off)</span></>}</div>
          <p className={`text-sm font-medium ${p.stock > 0 ? (p.stock <= 5 ? 'text-orange-600' : 'text-emerald-600') : 'text-red-600'}`}>{p.stock > 0 ? (p.stock <= 5 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</p>
          <p className="text-ink/75 leading-relaxed whitespace-pre-line">{p.description}</p>
          {p.sizes.length > 0 && <div><p className="text-sm font-medium mb-2">Size</p><div className="flex flex-wrap gap-2">{p.sizes.map((s) => <button key={s} className={chip(size === s)} onClick={() => setSize(s)} aria-pressed={size === s}>{s}</button>)}</div></div>}
          {p.colors.length > 0 && <div><p className="text-sm font-medium mb-2">Color</p><div className="flex flex-wrap gap-2">{p.colors.map((c) => <button key={c} className={chip(color === c)} onClick={() => setColor(c)} aria-pressed={color === c}>{c}</button>)}</div></div>}
          <div className="flex items-center gap-3"><span className="text-sm font-medium">Qty</span>
            <button className="btn-outline !px-4" aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="w-6 text-center">{qty}</span>
            <button className="btn-outline !px-4" aria-label="Increase" onClick={() => setQty(Math.min(qty + 1, Math.min(10, p.stock)))}>+</button></div>
          {err && <p role="alert" className="text-sm text-red-600">⚠ {err}</p>}
          <div className="flex gap-3 flex-wrap"><button className="btn-primary flex-1" disabled={busy || p.stock < 1} onClick={() => add(false)}>{busy ? 'Adding to cart...' : 'Add to Bag'}</button>
            <button className="btn-rose flex-1" disabled={busy || p.stock < 1} onClick={() => add(true)}>Buy Now</button></div>
        </div>
      </div>
      {zoom && <div className="fixed inset-0 z-50 bg-ink/90 grid place-items-center p-4 cursor-zoom-out" onClick={() => setZoom(false)} role="dialog" aria-label="Zoomed image"><img src={imgs[idx]} alt={p.name} className="max-h-full max-w-full rounded-xl" /></div>}
    </div>
  );
}
