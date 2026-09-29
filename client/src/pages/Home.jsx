import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';
import ProductCard from '../components/ProductCard.jsx';
import { ErrorState, ProductSkeletons } from '../components/ui.jsx';

function Row({ title, params, to }) {
  const { data, loading, error, reload } = useFetch(() => getProducts({ limit: 4, ...params }), [JSON.stringify(params)]);
  if (!loading && !error && !data?.products.length) return null;
  return (
    <section className="container-x mt-16">
      <div className="flex items-end justify-between mb-6"><h2 className="text-2xl sm:text-3xl">{title}</h2><Link to={to} className="text-sm text-rose hover:underline">View all →</Link></div>
      {loading ? <ProductSkeletons n={4} /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{data.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>)}
    </section>
  );
}

export default function Home() {
  const cats = useFetch(() => getCategories(), []);
  const groups = [['WOMEN', 'Women', 'from-rose-soft to-sand'], ['GIRLS', 'Girls', 'from-sand to-rose-soft'], ['CHILD_GIRLS', 'Child Girls', 'from-rose-soft to-cream']];
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-soft via-cream to-sand">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-rose/10 blur-3xl" aria-hidden />
        <div className="container-x py-20 sm:py-28 lg:py-36 grid lg:grid-cols-2 gap-10 items-center relative">
          <div className="animate-fadeUp">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">✦ NEW COLLECTION 2026</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6">Define your <em className="text-rose">style.</em></h1>
            <p className="text-lg text-ink/70 max-w-md mb-8">Discover fashion that feels uniquely yours — for women, girls and little girls.</p>
            <div className="flex flex-wrap gap-3"><Link to="/products" className="btn-primary">Shop Now</Link><Link to="/products?sort=discount" className="btn-outline">Explore Collection</Link></div>
          </div>
          <div className="hidden lg:grid grid-cols-3 gap-4" aria-hidden>
            {groups.map(([a, l, g], i) => <Link key={a} to={`/products?audience=${a}`} className={`aspect-[3/5] rounded-[2rem] bg-gradient-to-b ${g} border border-white/60 shadow-lg grid place-items-end p-5 hover:-translate-y-2 transition ${i === 1 ? 'mt-10' : ''}`}><span className="font-display text-xl">{l}</span></Link>)}
          </div>
        </div>
      </section>
      <section className="container-x mt-12 grid sm:grid-cols-3 gap-4 lg:hidden">
        {groups.map(([a, l]) => <Link key={a} to={`/products?audience=${a}`} className="card p-6 text-center font-display text-xl hover:border-rose">{l}</Link>)}
      </section>
      {cats.data?.categories.length > 0 && (
        <section className="container-x mt-16"><h2 className="text-2xl sm:text-3xl mb-6">Popular Categories</h2>
          <div className="flex flex-wrap gap-3">{cats.data.categories.map((c) => <Link key={c.id} to={`/category/${c.slug}`} className="btn-outline">{c.name}</Link>)}</div></section>
      )}
      <Row title="New Arrivals" params={{ sort: 'newest' }} to="/products?sort=newest" />
      <Row title="Trending" params={{ sort: 'popular' }} to="/products?sort=popular" />
      <Row title="Featured" params={{ featured: 'true' }} to="/products" />
      <Row title="Discount Collection" params={{ minDiscount: 10, sort: 'discount' }} to="/products?sort=discount" />
      <Row title="Women" params={{ audience: 'WOMEN' }} to="/products?audience=WOMEN" />
      <Row title="Girls" params={{ audience: 'GIRLS' }} to="/products?audience=GIRLS" />
      <Row title="Child Girls" params={{ audience: 'CHILD_GIRLS' }} to="/products?audience=CHILD_GIRLS" />
    </>
  );
}
