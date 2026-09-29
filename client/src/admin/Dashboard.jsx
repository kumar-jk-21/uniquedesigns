import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import { getDashboard } from '../services/adminService.js';
import { ErrorState, Loader } from '../components/ui.jsx';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => getDashboard(), []);
  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data.stats;
  const cards = [['Total Users', s.users], ['Total Products', s.products], ['Categories', s.categories], ['Admins', s.admins], ['Active Products', s.activeProducts], ['Inactive Products', s.inactiveProducts], ['Low Stock (≤5)', s.lowStock], ['Wishlist Items', s.wishlistItems]];
  const max = Math.max(1, ...data.productsByCategory.map((c) => c.count));
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Dashboard</h1>
        <div className="flex gap-2"><Link to="/admin/products/add" className="btn-primary">+ Add Product</Link><Link to="/admin/categories" className="btn-outline">Categories</Link></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([l, n]) => <div key={l} className="card p-5"><p className="text-3xl font-display">{n}</p><p className="text-sm text-ink/60">{l}</p></div>)}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6"><h2 className="text-xl mb-4">Products by category</h2>
          {data.productsByCategory.length === 0 ? <p className="text-sm text-ink/60">No categories yet.</p> : <ul className="space-y-3">{data.productsByCategory.map((c) => (
            <li key={c.name} className="text-sm"><div className="flex justify-between mb-1"><span>{c.name}</span><span>{c.count}</span></div><div className="h-2 rounded-full bg-sand"><div className="h-2 rounded-full bg-rose" style={{ width: `${(c.count / max) * 100}%` }} /></div></li>))}</ul>}</section>
        <section className="card p-6"><h2 className="text-xl mb-4">Low stock</h2>
          {data.lowStockProducts.length === 0 ? <p className="text-sm text-ink/60">All products are well stocked.</p> : <ul className="divide-y divide-sand text-sm">{data.lowStockProducts.map((p) => <li key={p.id} className="flex justify-between py-2"><Link className="hover:text-rose" to={`/admin/products/edit/${p.id}`}>{p.name}</Link><b className={p.stock === 0 ? 'text-red-600' : 'text-orange-600'}>{p.stock}</b></li>)}</ul>}</section>
        <section className="card p-6 lg:col-span-2"><h2 className="text-xl mb-4">Recent registrations</h2>
          {data.recentUsers.length === 0 ? <p className="text-sm text-ink/60">No users yet.</p> : <ul className="divide-y divide-sand text-sm">{data.recentUsers.map((u) => <li key={u.id} className="flex justify-between gap-4 py-2"><span>{u.fullName} <span className="text-ink/50">· {u.email}</span></span><span className="text-ink/50">{new Date(u.createdAt).toLocaleDateString('en-IN')}</span></li>)}</ul>}</section>
      </div>
    </div>
  );
}
