import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useFetch, { useDebounce } from '../hooks/useFetch.js';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, ErrorState, Pagination, ProductSkeletons } from '../components/ui.jsx';

const SORTS = [['newest', 'Newest'], ['price_asc', 'Price: Low → High'], ['price_desc', 'Price: High → Low'], ['discount', 'Highest Discount'], ['popular', 'Popular']];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export default function Products() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const dq = useDebounce(q);
  const [showFilters, setShowFilters] = useState(false);
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  useEffect(() => { if ((sp.get('q') || '') !== dq) set('q', dq); }, [dq]); // eslint-disable-line
  useEffect(() => setQ(sp.get('q') || ''), [sp.get('q')]); // eslint-disable-line

  const params = { ...Object.fromEntries(sp), ...(slug ? { category: slug } : {}), limit: 12 };
  const { data, meta, loading, error, reload } = useFetch(() => getProducts(params), [sp.toString(), slug]);
  const cats = useFetch(() => getCategories(), []);
  const get = (k) => sp.get(k) || '';
  const clear = () => { setSp({}); setQ(''); };

  const Filters = (
    <div className="space-y-5 text-sm">
      <div><label className="font-medium block mb-1.5" htmlFor="aud">Shop for</label>
        <select id="aud" className="input" value={get('audience')} onChange={(e) => set('audience', e.target.value)}><option value="">All</option><option value="WOMEN">Women</option><option value="GIRLS">Girls</option><option value="CHILD_GIRLS">Child Girls</option></select></div>
      {!slug && <div><label className="font-medium block mb-1.5" htmlFor="cat">Category</label>
        <select id="cat" className="input" value={get('category')} onChange={(e) => set('category', e.target.value)}><option value="">All</option>{cats.data?.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></div>}
      <div><p className="font-medium mb-1.5">Price (₹)</p><div className="flex gap-2">
        <input className="input" inputMode="numeric" placeholder="Min" aria-label="Min price" value={get('minPrice')} onChange={(e) => set('minPrice', e.target.value.replace(/\D/g, ''))} />
        <input className="input" inputMode="numeric" placeholder="Max" aria-label="Max price" value={get('maxPrice')} onChange={(e) => set('maxPrice', e.target.value.replace(/\D/g, ''))} /></div></div>
      <div><label className="font-medium block mb-1.5" htmlFor="disc">Discount</label>
        <select id="disc" className="input" value={get('minDiscount')} onChange={(e) => set('minDiscount', e.target.value)}><option value="">Any</option><option value="10">10% or more</option><option value="25">25% or more</option><option value="50">50% or more</option></select></div>
      <div><label className="font-medium block mb-1.5" htmlFor="size">Size</label>
        <select id="size" className="input" value={get('size')} onChange={(e) => set('size', e.target.value)}><option value="">Any</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div><label className="font-medium block mb-1.5" htmlFor="color">Color</label>
        <input id="color" className="input" placeholder="e.g. Red" value={get('color')} onChange={(e) => set('color', e.target.value)} /></div>
      <label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" checked={get('inStock') === 'true'} onChange={(e) => set('inStock', e.target.checked ? 'true' : '')} /> In stock only</label>
      <button className="btn-outline w-full" onClick={clear}>Clear filters</button>
    </div>
  );

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-3xl mr-auto capitalize">{slug ? slug.replace(/-/g, ' ') : 'All Products'}</h1>
        <input className="input !w-full sm:!w-64" placeholder="Search products…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" aria-label="Sort" value={get('sort') || 'newest'} onChange={(e) => set('sort', e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button className="btn-outline lg:hidden" onClick={() => setShowFilters(!showFilters)}>Filters</button>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block card p-5 h-fit lg:sticky lg:top-24`}>{Filters}</aside>
        <div>
          {loading ? <ProductSkeletons n={8} /> : error ? <ErrorState error={error} onRetry={reload} />
            : data.products.length === 0 ? <EmptyState title="No products found" text="Try changing your filters or search." to="/products" cta="Clear search" />
            : (<><p className="text-sm text-ink/60 mb-4">{meta.total} product{meta.total !== 1 && 's'}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">{data.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              <Pagination meta={meta} onPage={(n) => { set('page', String(n)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></>)}
        </div>
      </div>
    </div>
  );
}
