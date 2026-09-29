import { useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/categoryService.js';
import { useToast } from '../context/ToastContext.jsx';
import { ConfirmationModal, EmptyState, ErrorMessage, ErrorState, Loader } from '../components/ui.jsx';

export default function AdminCategories() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => getCategories({ includeInactive: 'true' }), []);
  const [name, setName] = useState(''); const [editing, setEditing] = useState(null); const [msg, setMsg] = useState('');
  const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const run = async (fn, ok) => { setBusy(true); setMsg(''); try { await fn(); toast.success(ok); reload(); return true; } catch (e) { setMsg(e.message); return false; } finally { setBusy(false); } };
  const save = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setMsg('Category name must be 2-60 characters.');
    const done = await run(() => (editing ? updateCategory(editing.id, { name }) : createCategory(name)), editing ? 'Category updated' : 'Category added');
    if (done) { setName(''); setEditing(null); }
  };
  return (
    <div className="space-y-6 max-w-3xl"><h1 className="text-3xl">Categories</h1>
      <form onSubmit={save} className="card p-4 flex flex-wrap gap-3" noValidate>
        <input className="input flex-1 min-w-[200px]" aria-label="Category name" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={busy}>{editing ? 'Update' : 'Add category'}</button>
        {editing && <button type="button" className="btn-outline" onClick={() => { setEditing(null); setName(''); }}>Cancel</button>}
        <div className="w-full"><ErrorMessage message={msg} /></div></form>
      {loading ? <Loader /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.categories.length ? <EmptyState title="No categories" text="Add your first category above." /> : (
        <ul className="card divide-y divide-sand">{data.categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 text-sm"><span className="font-medium">{c.name}</span><span className="text-ink/50">{c._count.products} products</span>
            <span className={`rounded-full px-2.5 py-1 text-xs ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-sand text-ink/60'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
            <span className="ml-auto space-x-3"><button className="text-rose" onClick={() => { setEditing(c); setName(c.name); }}>Edit</button>
              <button onClick={() => run(() => updateCategory(c.id, { isActive: !c.isActive }), c.isActive ? 'Category deactivated' : 'Category activated')}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
              <button className="text-red-600" onClick={() => setDel(c)}>Delete</button></span></li>))}</ul>)}
      <ConfirmationModal open={!!del} danger busy={busy} title="Delete category?" message={del?._count.products ? `This category has ${del._count.products} product(s), so it can't be deleted. Deactivate it instead.` : `Delete "${del?.name}"?`}
        confirmLabel="Delete" onConfirm={async () => { await run(() => deleteCategory(del.id), 'Category deleted'); setDel(null); }} onCancel={() => setDel(null)} />
    </div>
  );
}
