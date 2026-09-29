import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="bg-ink text-white/80 mt-20">
      <div className="container-x py-12 grid gap-8 sm:grid-cols-3">
        <div><p className="font-display text-2xl tracking-[0.18em] text-white mb-3">UNIQUE DESIGNS</p><p className="text-sm">Define your style. Premium fashion for women and girls.</p></div>
        <div className="text-sm space-y-2"><p className="text-white font-medium">Shop</p>
          <Link className="block hover:text-white" to="/products?audience=WOMEN">Women</Link><Link className="block hover:text-white" to="/products?audience=GIRLS">Girls</Link><Link className="block hover:text-white" to="/products?audience=CHILD_GIRLS">Child Girls</Link></div>
        <div className="text-sm space-y-2"><p className="text-white font-medium">Account</p>
          <Link className="block hover:text-white" to="/login">Login</Link><Link className="block hover:text-white" to="/register">Create account</Link><Link className="block hover:text-white" to="/user/wishlist">Wishlist</Link></div>
      </div>
      <p className="text-center text-xs py-4 border-t border-white/10">© {new Date().getFullYear()} Unique Designs. All rights reserved.</p>
    </footer>
  );
}
