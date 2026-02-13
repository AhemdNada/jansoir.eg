import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { CategoryProvider } from './context/CategoryContext';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';
import { FavoriteProvider } from './context/FavoriteContext';
import Loader from './components/common/Loader.jsx';
import './App.css';

/**
 * Performance: Lazy-load layout components that don't affect LCP.
 *
 * Navbar is position:fixed on mobile (doesn't affect document flow).
 * The hero section's mt-[120px] reserves visual space for it.
 * Footer, CustomizeButton, SocialMediaBar are below-the-fold or decorative.
 * ScrollManager is non-visual (analytics).
 *
 * By lazy-loading these, Swiper (20.8KB gz) and FontAwesome (28.2KB gz)
 * are removed from the critical rendering path, allowing React to mount
 * ~250ms faster on throttled mobile connections.
 */
const Navbar = lazy(() => import('./components/layout/Navbar'));
const Footer = lazy(() => import('./components/layout/Footer'));
const CustomizeButton = lazy(() => import('./components/common/CustomizeButton'));
const SocialMediaBar = lazy(() => import('./components/common/SocialMediaBar'));
const ScrollManager = lazy(() => import('./components/common/ScrollManager'));


// Main Store Pages
// Performance: Preload Home chunk immediately on app load.
// Without this, Home downloads sequentially AFTER the index bundle parses.
// By starting the import here (top-level), it downloads in parallel.
const homeImport = import('./pages/Home');
const Home = lazy(() => homeImport);
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Customize = lazy(() => import('./pages/Customize'));

// Admin Components and Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const CartManagement = lazy(() => import('./pages/admin/CartManagement'));
const History = lazy(() => import('./pages/admin/History'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const CustomizeRequests = lazy(() => import('./pages/admin/CustomizeRequests'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <FavoriteProvider>
      <CategoryProvider>
        <ProductProvider>
          <CartProvider>
                <Suspense fallback={null}><ScrollManager /></Suspense>
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Orders />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="admins" element={<AdminManagement />} />
                  <Route path="cart" element={<CartManagement />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="history" element={<History />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="customize" element={<CustomizeRequests />} />
                </Route>

                {/* Main Store Routes */}
                <Route path="/*" element={
                  <div className="App min-h-screen flex flex-col">
                    {/* Navbar fallback: On mobile the header is position:fixed (no flow space),
                        so no placeholder needed. On desktop it's position:sticky (187px in flow),
                        so we reserve that space to prevent CLS when Navbar lazy-loads. */}
                    <Suspense fallback={
                      <div className="hidden lg:block w-full" style={{height: '187px', backgroundColor: '#0B0B0B'}} />
                    }>
                      <Navbar />
                    </Suspense>
                    <main id="main-content" className="flex-grow pb-[60px] lg:pb-0">
                      <Routes>
                        <Route path="/" element={
                          <Suspense fallback={<Loader />}>
                            <Home />
                          </Suspense>
                        } />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                            <Route path="/favorites" element={<Favorites />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/customize" element={<Customize />} />
                      </Routes>
                    </main>
                    {/* Below-fold / decorative components: lazy-load with null fallback */}
                    <Suspense fallback={null}>
                      <Footer />
                    </Suspense>
                    <Suspense fallback={null}>
                      <CustomizeButton />
                    </Suspense>
                    <Suspense fallback={null}>
                      <SocialMediaBar />
                    </Suspense>
                  </div>
                } />
              </Routes>
            </Suspense>
          </CartProvider>
        </ProductProvider>
      </CategoryProvider>
        </FavoriteProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;