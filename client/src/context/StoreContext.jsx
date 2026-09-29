import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import * as cartApi from '../services/cartService.js';
import * as wlApi from '../services/wishlistService.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);
const GUEST_KEY = 'ud_guest_cart';
const readGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; } };

// Cart + wishlist state. Guests use localStorage; logged-in users use the API (with guest-cart merge on login).
export function StoreProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const isCustomer = user && user.role === 'USER';
  const [cart, setCart] = useState({ items: [], summary: { subtotal: 0, discount: 0, total: 0, count: 0 } });
  const [guest, setGuest] = useState(readGuest);
  const [wishIds, setWishIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const merged = useRef(null);

  const refresh = useCallback(async () => {
    if (!isCustomer) return;
    setLoading(true);
    try {
      const [c, w] = await Promise.all([cartApi.getCart(), wlApi.getWishlist()]);
      setCart(c.data);
      setWishIds(new Set(w.data.items.map((i) => i.product.id)));
    } catch { /* surfaced by pages that call refresh explicitly */ } finally { setLoading(false); }
  }, [isCustomer]);

  useEffect(() => {
    if (!isCustomer) { setWishIds(new Set()); merged.current = null; return; }
    (async () => {
      if (merged.current !== user.id) {
        merged.current = user.id;
        const g = readGuest();
        if (g.length) {
          try {
            const r = await cartApi.mergeCart(g);
            localStorage.removeItem(GUEST_KEY); setGuest([]);
            if (r.data.skipped?.length) toast.info(`Some items were no longer available: ${r.data.skipped.join(', ')}`);
          } catch (e) { toast.error(e.message); }
        }
      }
      refresh();
    })();
  }, [isCustomer, user?.id]); // eslint-disable-line

  const saveGuest = (items) => { setGuest(items); localStorage.setItem(GUEST_KEY, JSON.stringify(items)); };

  const addToCart = async (product, { quantity = 1, size = '', color = '' } = {}) => {
    if (product.stock < 1) throw { message: 'This item is out of stock.' };
    if (isCustomer) { const r = await cartApi.addToCart({ productId: product.id, quantity, size, color }); setCart(r.data); return; }
    const items = [...guest];
    const i = items.findIndex((x) => x.productId === product.id && x.size === size && x.color === color);
    const next = (i >= 0 ? items[i].quantity : 0) + quantity;
    if (next > product.stock) throw { message: `Only ${product.stock} unit(s) available.` };
    if (i >= 0) items[i] = { ...items[i], quantity: next }; else items.push({ productId: product.id, quantity, size, color, product });
    saveGuest(items);
  };
  const updateQty = async (item, quantity) => {
    if (isCustomer) { const r = await cartApi.updateCartItem(item.id, quantity); setCart(r.data); return; }
    if (quantity > item.product.stock) throw { message: `Only ${item.product.stock} unit(s) available.` };
    saveGuest(guest.map((x) => (x === item ? { ...x, quantity } : x)));
  };
  const removeItem = async (item) => {
    if (isCustomer) { const r = await cartApi.removeCartItem(item.id); setCart(r.data); return; }
    saveGuest(guest.filter((x) => x !== item));
  };
  const toggleWish = async (productId) => {
    if (!isCustomer) throw { code: 'LOGIN_REQUIRED', message: 'Please login to use your wishlist.' };
    if (wishIds.has(productId)) { await wlApi.removeFromWishlist(productId); setWishIds((s) => { const n = new Set(s); n.delete(productId); return n; }); return false; }
    await wlApi.addToWishlist(productId); setWishIds((s) => new Set(s).add(productId)); return true;
  };

  // Uniform shape for the cart page
  const items = isCustomer ? cart.items
    : guest.map((g, i) => ({ id: 'g' + i, ...g, available: g.product.stock > 0, maxQuantity: Math.min(10, g.product.stock), lineTotal: g.product.finalPrice * g.quantity }));
  const summary = isCustomer ? cart.summary : (() => {
    const sub = guest.reduce((n, g) => n + g.product.price * g.quantity, 0), tot = guest.reduce((n, g) => n + g.product.finalPrice * g.quantity, 0);
    return { subtotal: sub, discount: sub - tot, total: tot, count: guest.reduce((n, g) => n + g.quantity, 0) };
  })();

  return <Ctx.Provider value={{ items, summary, loading, wishIds, addToCart, updateQty, removeItem, toggleWish, refresh, cartCount: summary.count, wishCount: wishIds.size }}>{children}</Ctx.Provider>;
}
