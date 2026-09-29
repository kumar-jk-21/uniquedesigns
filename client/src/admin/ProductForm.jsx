import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import { deleteProductImage, getProduct, saveProduct } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';
import { imgUrl } from '../services/api.js';
import { money, validateImage } from '../utils/validation.js';
import { useToast } from '../context/ToastContext.jsx';
import { ErrorMessage, ErrorState, Loader } from '../components/ui.jsx';
import { Field, cls } from '../components/FormField.jsx';

const EMPTY = { name: '', description: '', audience: 'WOMEN', categoryId: '', price: '', discountType: 'NONE', discountValue: '', stock: '0', sizes: '', colors: '', isActive: true, isFeatured: false };

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const cats = useFetch(() => getCategories({ includeInactive: 'true' }), []);
  const prod = useFetch(() => (id ? getProduct(id) : Promise.resolve({ data: null })), [id]);
  const [v, setV] = useState(EMPTY);
  const [existing, setExisting] = useState([]);
  const [files, setFiles] = useState([]);
  const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = prod.data?.product; if (!p) return;
    setV({ name: p.name, description: p.description, audience: p.audience, categoryId: p.categoryId, price: String(p.price), discountType: p.discountType, discountValue: String(p.discountValue || ''), stock: String(p.stock), sizes: p.sizes.join(', '), colors: p.colors.join(', '), isActive: p.isActive, isFeatured: p.isFeatured });
    setExisting(p.images);
  }, [prod.data]);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const on = (e) => { const { name, value, type, checked } = e.target; setV((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value })); setErrs((s) => ({ ...s, [name]: '' })); };
  const price = Number(v.price) || 0, dv = Number(v.discountValue) || 0;
  const disc = v.discountType === 'PERCENTAGE' ? price * dv / 100 : v.discountType === 'FIXED' ? dv : 0;
  const finalPrice = Math.max(0, price - disc);

  const addFiles = async (e) => {
    const list = [...e.target.files]; e.target.value = '';
    if (existing.length + files.length + list.length > 8) return toast.error('A product can have at most 8 images.');
    const good = [];
    for (const f of list) { const m = await validateImage(f); if (m) toast.error(`${f.name}: ${m}`); else good.push(f); }
    setFiles((s) => [...s, ...good]);
  };
  const removeExisting = async (img) => {
    try { await deleteProductImage(id, img.id); setExisting((s) => s.filter((x) => x.id !== img.id)); toast.success('Image removed'); } catch (e) { toast.error(e.message); }
  };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (v.name.trim().length < 2) er.name = 'Product name must be 2-120 characters.';
    if (v.description.trim().length < 10) er.description = 'Description must be at least 10 characters.';
    if (!v.categoryId) er.categoryId = 'Please select a category.';
    if (!(price > 0)) er.price = 'Enter a valid price greater than 0.';
    if (v.discountType === 'PERCENTAGE' && !(dv > 0 && dv <= 100)) er.discountValue = 'Percentage must be between 0 and 100.';
    if (v.discountType === 'FIXED' && !(dv > 0 && dv <= price)) er.discountValue = 'Fixed discount cannot exceed the price.';
    if (!/^\d+$/.test(v.stock)) er.stock = 'Stock must be a whole number, 0 or more.';
    setErrs(er); if (Object.keys(er).length) return;
    setBusy(true); setMsg('');
    try {
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, k === 'discountValue' && v.discountType === 'NONE' ? '0' : val));
      files.forEach((f) => fd.append('images', f));
      await saveProduct(id, fd); toast.success(id ? 'Product updated' : 'Product created'); nav('/admin/products');
    } catch (x) { setMsg(x.message); setErrs(x.fields || {}); } finally { setBusy(false); }
  };

  if (cats.loading || prod.loading) return <Loader />;
  if (cats.error || prod.error) return <ErrorState error={cats.error || prod.error} onRetry={() => { cats.reload(); prod.reload(); }} />;
  const E = (n) => errs[n];
  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <h1 className="text-3xl">{id ? 'Edit Product' : 'Add Product'}</h1>
      <ErrorMessage message={msg} />
      <div className="card p-6 space-y-4">
        <Field label="Name" name="name" required error={E('name')}><input id="name" name="name" value={v.name} onChange={on} className={cls(E('name'))} /></Field>
        <Field label="Description" name="description" required error={E('description')}><textarea id="description" name="description" rows={4} value={v.description} onChange={on} className={cls(E('description')) + ' py-3'} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Category" name="categoryId" required error={E('categoryId')}><select id="categoryId" name="categoryId" value={v.categoryId} onChange={on} className={cls(E('categoryId'))}><option value="">Select category</option>{cats.data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>)}</select></Field>
          <Field label="For" name="audience" required error={E('audience')}><select id="audience" name="audience" value={v.audience} onChange={on} className={cls(E('audience'))}><option value="WOMEN">Women</option><option value="GIRLS">Girls</option><option value="CHILD_GIRLS">Child Girls</option></select></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Price (₹)" name="price" required error={E('price')}><input id="price" name="price" inputMode="decimal" value={v.price} onChange={on} className={cls(E('price'))} /></Field>
          <Field label="Discount" name="discountType" error={E('discountType')}><select id="discountType" name="discountType" value={v.discountType} onChange={on} className={cls()}><option value="NONE">No Discount</option><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></Field>
          {v.discountType !== 'NONE' && <Field label={v.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount (₹)'} name="discountValue" error={E('discountValue')}><input id="discountValue" name="discountValue" inputMode="decimal" value={v.discountValue} onChange={on} className={cls(E('discountValue'))} /></Field>}
        </div>
        <p className="text-sm rounded-xl bg-rose-soft px-4 py-3">Final price: <b>{money(finalPrice)}</b>{disc > 0 && <> · discount {money(disc)}</>}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Stock" name="stock" required error={E('stock')}><input id="stock" name="stock" inputMode="numeric" value={v.stock} onChange={on} className={cls(E('stock'))} /></Field>
          <Field label="Sizes" name="sizes" hint="Comma separated: S, M, L"><input id="sizes" name="sizes" value={v.sizes} onChange={on} className={cls()} /></Field>
          <Field label="Colors" name="colors" hint="Comma separated: Red, Blue"><input id="colors" name="colors" value={v.colors} onChange={on} className={cls()} /></Field>
        </div>
        <div className="flex gap-6 text-sm"><label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" name="isActive" checked={v.isActive} onChange={on} /> Active</label><label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" name="isFeatured" checked={v.isFeatured} onChange={on} /> Featured</label></div>
      </div>
      <div className="card p-6 space-y-4"><h2 className="text-xl">Images <span className="text-sm text-ink/50 font-sans">(JPG/PNG/WebP, max 5 MB, up to 8)</span></h2>
        <div className="flex flex-wrap gap-3">
          {existing.map((i) => <div key={i.id} className="relative h-28 w-24 rounded-xl overflow-hidden"><img src={imgUrl(i.url)} alt="" className="h-full w-full object-cover" /><button type="button" aria-label="Delete image" onClick={() => removeExisting(i)} className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/90 text-red-600">✕</button></div>)}
          {previews.map((u, i) => <div key={u} className="relative h-28 w-24 rounded-xl overflow-hidden ring-2 ring-rose"><img src={u} alt="New upload preview" className="h-full w-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))} className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/90 text-red-600">✕</button></div>)}
          <label className="grid h-28 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-ink/25 text-2xl text-ink/40 hover:border-rose">+<input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={addFiles} /></label>
        </div>{E('images') && <p role="alert" className="text-xs text-red-600">⚠ {E('images')}</p>}</div>
      <div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy ? (files.length ? 'Uploading image...' : 'Saving...') : id ? 'Save changes' : 'Create product'}</button><button type="button" className="btn-outline" onClick={() => nav('/admin/products')}>Cancel</button></div>
    </form>
  );
}
