import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ErrorPage, Loader } from './components/ui.jsx';

const L = (p) => lazy(p);
const Home = L(() => import('./pages/Home.jsx'));
const Products = L(() => import('./pages/Products.jsx'));
const ProductDetails = L(() => import('./pages/ProductDetails.jsx'));
const Login = L(() => import('./pages/Login.jsx'));
const Register = L(() => import('./pages/Register.jsx'));
const Recovery = L(() => import('./pages/Recovery.jsx'));
const Cart = L(() => import('./pages/Cart.jsx'));
const Wishlist = L(() => import('./pages/Wishlist.jsx'));
const Account = L(() => import('./pages/Account.jsx'));
const AdminLayout = L(() => import('./admin/AdminLayout.jsx'));
const AdminLogin = L(() => import('./admin/AdminLogin.jsx'));
const Dashboard = L(() => import('./admin/Dashboard.jsx'));
const AdminProducts = L(() => import('./admin/AdminProducts.jsx'));
const ProductForm = L(() => import('./admin/ProductForm.jsx'));
const AdminCategories = L(() => import('./admin/AdminCategories.jsx'));
const AdminUsers = L(() => import('./admin/AdminUsers.jsx'));
const AdminAdmins = L(() => import('./admin/AdminAdmins.jsx'));
const AdminProfile = L(() => import('./admin/AdminProfile.jsx'));

function Shop() {
  const { pathname } = useLocation();
  const bare = ['/login', '/register'].includes(pathname);
  return (<>{!bare && <Navbar />}<main className="min-h-[70vh]" key={pathname}><Outlet /></main>{!bare && <Footer />}</>);
}
const Guard = ({ children, ...p }) => <ProtectedRoute {...p}>{children}</ProtectedRoute>;

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<Shop />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="category/:slug" element={<Products />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<Recovery step="email" />} />
          <Route path="verify-otp" element={<Recovery step="otp" />} />
          <Route path="reset-password" element={<Recovery step="reset" />} />
          <Route path="user/cart" element={<Cart />} />
          <Route path="user/dashboard" element={<Guard><Account view="dashboard" /></Guard>} />
          <Route path="user/profile" element={<Guard><Account view="profile" /></Guard>} />
          <Route path="user/profile/edit" element={<Guard><Account view="edit" /></Guard>} />
          <Route path="user/wishlist" element={<Guard><Wishlist /></Guard>} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Guard admin><AdminLayout /></Guard>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="admins" element={<Guard admin superAdmin><AdminAdmins /></Guard>} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
