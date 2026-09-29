import { useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import { getWishlist } from '../services/wishlistService.js';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, ErrorState, ProductSkeletons } from '../components/ui.jsx';

export default function Wishlist() {
  const { data, loading, error, reload } = useFetch(() => getWishlist(), []);
  const { addToCart, toggleWish, wishIds } = useStore();
  const toast = useToast();
  const [gone, setGone] = useState(new Set());
  const items = (data?.items || []).filter((i) => !gone.has(i.product.id));
  const move = async (p) => {
    try {
      if (p.sizes.length || p.colors.length) return toast.info('Please choose size/color on the product page.');
      await addToCart(p); if (wishIds.has(p.id)) await toggleWish(p.id); setGone(new Set(gone).add(p.id)); toast.success('Moved to your bag');
    } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="container-x py-8"><h1 className="text-3xl mb-6">My Wishlist</h1>
      {loading ? <ProductSkeletons n={4} /> : error ? <ErrorState error={error} onRetry={reload} />
        : !items.length ? <EmptyState icon="♡" title="Your wishlist is waiting for something beautiful." text="Discover our latest collections." to="/products" cta="Explore Products" />
        : <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">{items.map(({ product: p }) => (
          <div key={p.id}><ProductCard product={{ ...p, stock: p.stock }} /><button className="btn-outline w-full mt-2 !min-h-[38px]" onClick={() => move(p)} disabled={p.stock < 1}>Move to bag</button></div>))}</div>}
    </div>
  );
}
