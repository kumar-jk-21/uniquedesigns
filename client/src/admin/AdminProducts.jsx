import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch, { useDebounce } from '../hooks/useFetch.js';
import { deleteProduct, getProducts, saveProduct } from '../services/productService.js';
import { imgUrl } from '../services/api.js';
import { money } from '../utils/validation.js';
import { useToast } from '../context/ToastContext.jsx';
import { ConfirmationModal, EmptyState, ErrorState, Loader, Pagination } from '../components/ui.jsx';

export default function AdminProducts() {
  const toast = useToast();
  const [page, setPage] = useState(1); const [q, setQ] = useState(''); const dq = useDebounce(q);
  const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, reload } = useFetch(() => getProducts({ includeInactive: 'true', page, limit: 10, q: dq }), [page, dq]);
  const toggle = async (p) => {
    const fd = new FormData(); fd.append('isActive', String(!p.isActive));
    try { await saveProduct(p.id, fd); toast.success(p.isActive ? 'Product deactivated' : 'Product activated'); reload(); } catch (e) { toast.error(e.message); }
  };
  const confirmDelete = async () => {
    setBusy(true);
    try { await deleteProduct(del.id); toast.success('Product deleted'); setDel(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl mr-auto">Products</h1>
        <input className="input !w-full sm:!w-64" placeholder="Search…" aria-label="Search products" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Link to="/admin/products/add" className="btn-primary">+ Add Product</Link></div>
      {loading ? <Loader text="Loading products..." /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.products.length ? <EmptyState title="No products yet" text="Add your first product." to="/admin/products/add" cta="Add Product" /> : (
        <div className="card overflow-x-auto"><table className="w-full text-sm min-w-[720px]"><thead className="text-left text-ink/60 border-b border-sand"><tr>{['Product', 'Category', 'Price', 'Discount', 'Stock', 'Status', ''].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-sand">{data.products.map((p) => (
            <tr key={p.id}><td className="p-3"><div className="flex items-center gap-3"><div className="h-12 w-10 rounded-lg bg-sand overflow-hidden shrink-0">{p.images[0] && <img src={imgUrl(p.images[0].url)} alt="" className="h-full w-full object-cover" />}</div><span className="font-medium">{p.name}</span></div></td>
              <td className="p-3">{p.category.name}</td><td className="p-3">{money(p.finalPrice)}{p.discountAmount > 0 && <s className="block text-xs text-ink/40">{money(p.price)}</s>}</td>
              <td className="p-3">{p.discountType === 'NONE' ? '—' : p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : money(p.discountValue)}</td>
              <td className={`p-3 ${p.stock <= 5 ? 'text-red-600 font-medium' : ''}`}>{p.stock}</td>
              <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-sand text-ink/60'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
              <td className="p-3 whitespace-nowrap space-x-3"><Link className="text-rose" to={`/admin/products/edit/${p.id}`}>Edit</Link><button className="text-ink/70" onClick={() => toggle(p)}>{p.isActive ? 'Deactivate' : 'Activate'}</button><button className="text-red-600" onClick={() => setDel(p)}>Delete</button></td></tr>))}</tbody></table></div>)}
      <Pagination meta={meta} onPage={setPage} />
      <ConfirmationModal open={!!del} danger busy={busy} title="Delete product?" message={`"${del?.name}" and its images will be permanently deleted.`} confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </div>
  );
}
