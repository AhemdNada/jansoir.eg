import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCategories } from '../../context/CategoryContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoriteContext';
import { productApi, getProductImageUrl } from '../../api/productApi';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
// FontAwesome (ONE import only)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// cspell:ignore Crosshairs
import { faTruckFast, faRotateLeft, faCircleQuestion, faLocationCrosshairs, faMagnifyingGlass, faHeart, faShoppingCart, faUser, faCog, faSignOut } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [_isSearchFocused, setIsSearchFocused] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const { getCartItemsCount } = useCart();
  const { categories, getActiveCategories } = useCategories();
  const { user, logout, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const location = useLocation();
  const searchBoxRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const lastQueryRef = useRef('');
  const SEARCH_LIMIT = 8;
  const SEARCH_DEBOUNCE_MS = 250;
  const MIN_QUERY_LENGTH = 2;

  const formatCategoryLabel = useCallback((category) => {
    if (!category) return '';
    const raw = typeof category === 'string' ? category : (category.name || category.slug || '');
    return String(raw)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
      setShowResults(false);
      return undefined;
    }

    setShowResults(true);
    setIsSearching(true);
    setSearchError('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = controller;
      lastQueryRef.current = query;

      try {
        const data = await productApi.searchProducts({
          query,
          limit: SEARCH_LIMIT,
          signal: controller.signal
        });

        if (lastQueryRef.current !== query) {
          return;
        }

        setSearchResults(data.data || []);
      } catch (err) {
        if (err.name === 'AbortError' || lastQueryRef.current !== query) {
          return;
        }
        setSearchResults([]);
        setSearchError(err.message || 'Search failed');
      } finally {
        if (lastQueryRef.current === query) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS, SEARCH_LIMIT]);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowResults(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    if (searchQuery.trim().length >= MIN_QUERY_LENGTH) {
      setShowResults(true);
    }
  }, [searchQuery, MIN_QUERY_LENGTH]);

  const handleSearchSelect = useCallback(() => {
    setShowResults(false);
    setIsSearchOpen(false);
    setIsSearchFocused(false);
  }, []);

  // Build categories list from API data
  const categoriesList = useMemo(() => {
    const activeCategories = getActiveCategories();
    const baseCats = [
      { id: 'home', label: 'Home', path: '/' },
      { id: 'all', label: 'All Products' }
    ];

    // Add categories from database
    const dbCats = activeCategories.map(cat => ({
      id: cat.slug,
      label: cat.name,
      categoryId: cat.slug
    }));

    return [...baseCats, ...dbCats];
  }, [categories, getActiveCategories]);

  const categorySearch = new URLSearchParams(location.search);
  const activeCategory = categorySearch.get('category') || 'all';
  const isProductsPage = location.pathname.startsWith('/products');
  return (
    <>
      <header className="fixed lg:sticky left-0 w-full top-0 lg:-top-[47px] z-[101] shadow-lg border-b border-woody" style={{ backgroundColor: '#0B0B0B', opacity: 1 }}>
        {/* Top Strip */}
        <div className={`top-strip hidden lg:block py-2 border-t-[1px] border-b-[1px] border-woody sticky top-0 transition-transform duration-300 ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`} style={{ backgroundColor: '#0B0B0B', opacity: 1 }}>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-beige">
            {/* Left Side */}
            <div className="flex items-center gap-6">
              <p className="text-[12px] font-[500] flex items-center gap-2">
                <FontAwesomeIcon icon={faTruckFast} className="text-gold" />
                Shipping calculated at checkout
              </p>
              <span className="h-4 w-[1px] bg-woody"></span>
              <p className="text-[12px] font-[500] flex items-center gap-2">
                <FontAwesomeIcon icon={faRotateLeft} className="text-gold" />
                30-Day Easy Returns
              </p>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-5">
              <Link to="/help-center" className="flex items-center gap-1 text-[12px] font-[500] hover:text-gold transition text-beige">
                <FontAwesomeIcon icon={faCircleQuestion} className="text-gold text-[13px]" /> Help Center
              </Link>
              <Link to="/order-tracking" className="flex items-center gap-1 text-[12px] font-[500] hover:text-gold transition text-beige">
                <FontAwesomeIcon icon={faLocationCrosshairs} className="text-gold text-[13px]" /> Track Order
              </Link>
              <span className="h-4 w-[1px] bg-woody"></span>

            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="header py-2 lg:py-4 border-b-[1px] border-woody" style={{ backgroundColor: '#0B0B0B', opacity: 1 }}>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo */}
            <div className="w-[40%] lg:w-[25%]">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/images/icon-title.webp" 
                  typeof=''
                  alt="Jansoir.eg Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl sm:text-3xl font-bold text-gold">Jansoir</span>
                    <span className="text-2xl sm:text-3xl font-bold text-beige">.eg</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.4em] font-light text-beige/70 uppercase mt-0.5 whitespace-nowrap">F R A G R A N C E</span>
                </div>
              </Link>
            </div>

            {/* Search - Desktop */}
            <div className="relative lg:w-[40%] z-[100] hidden lg:block">
              <div ref={searchBoxRef} className="w-full h-[50px] border border-woody rounded-md relative flex items-center bg-dark-base">
                <input
                  type="text"
                  placeholder="Search for products..."
                  aria-label="Search for products"
                  className="w-full h-full px-3 text-[15px] focus:outline-none text-beige placeholder-woody"
                  style={{ backgroundColor: '#0B0B0B', opacity: 1 }}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 150);
                  }}
                  
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setShowResults(false);
                      setIsSearchFocused(false);
                      event.currentTarget.blur();
                    }
                  }}
                />
                <button
                  aria-label="Search"
                  className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center text-beige hover:text-gold focus:outline-none transition-colors"
                  onClick={() => {
                    if (searchQuery.trim().length >= MIN_QUERY_LENGTH) {
                      setShowResults(true);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gold text-[22px]" />
                </button>
                {/* Close mobile search */}
                <button
                  aria-label="Close search"
                  className="lg:hidden absolute right-12 w-9 h-9 rounded-full flex items-center justify-center text-beige hover:text-gold focus:outline-none transition-colors"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setShowResults(false);
                    setIsSearchFocused(false);
                  }}
                >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
                    <path d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95-95-95a24 24 0 0 0-34 34l95 95-95 95a24 24 0 1 0 34 34l95-95 95 95a24 24 0 0 0 34-34z"></path>
                  </svg>
                </button>

                {showResults && (
                  <div
                    className="absolute left-0 right-0 top-full mt-2 border border-woody rounded-md shadow-lg max-h-80 overflow-y-auto z-[110] bg-[#0B0B0B] bg-opacity-100"
                    style={{ backgroundColor: '#0B0B0B', opacity: 1 }}
                  >
                    {isSearching && (
                      <div className="px-4 py-3 text-sm text-woody-light">Searching...</div>
                    )}

                    {!isSearching && searchError && (
                      <div className="px-4 py-3 text-sm text-woody-light">Unable to search products.</div>
                    )}

                    {!isSearching && !searchError && searchResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-woody-light">No products found.</div>
                    )}

                    {!isSearching && !searchError && searchResults.length > 0 && (
                      <div className="py-1">
                        {searchResults.map((product) => (
                          <Link
                            key={product._id}
                            to={`/product/${product._id}`}
                            onClick={handleSearchSelect}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-dark-light transition-colors"
                          >
                            <img
                              src={getProductImageUrl(product.image)}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover border border-woody flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-beige line-clamp-1">{product.name}</p>
                              {product.category && (
                                <p className="text-xs text-woody-light line-clamp-1">
                                  {formatCategoryLabel(product.category)}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gold font-semibold whitespace-nowrap">
                              {product.price} EGP
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 lg:gap-6 w-[20%] lg:w-[30%] justify-end">
              {/* User Info or Login/Register */}
              {isAuthenticated() ? (
                <div className="hidden lg:flex items-center gap-3 text-[15px] font-medium">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gold" />
                    <span className="text-beige">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-beige hover:text-gold transition-colors"
                    title="Logout"
                  >
                    <FontAwesomeIcon icon={faSignOut} className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2 text-[15px] font-medium">
                  <Link to="/login" className="text-beige hover:text-gold transition-colors">Login</Link>
                  <span className="text-woody">|</span>
                  <Link to="/register" className="text-beige hover:text-gold transition-colors">Register</Link>
                </div>
              )}

              {/* Search - Mobile only (in top bar next to favorites/cart) */}
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  if (searchQuery.trim().length >= MIN_QUERY_LENGTH) setShowResults(true);
                }}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-beige hover:text-gold transition-colors focus:outline-none"
                aria-label="Search"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
              </button>

              {/* Favorites */}
              <Link to="/favorites" className="relative" aria-label="Favorites">
                <FontAwesomeIcon icon={faHeart} className="w-5 h-5 text-beige hover:text-gold transition-colors" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-dark-base text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-semibold">
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative" aria-label="Cart">
                <FontAwesomeIcon icon={faShoppingCart} className="w-5 h-5 text-beige hover:text-gold transition-colors" />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-dark-base text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">{getCartItemsCount()}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Navigation */}
        <nav className="navigation border-b border-woody" style={{ backgroundColor: '#0B0B0B', opacity: 1 }}>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full lg:w-[60%] mx-auto flex items-center h-[60px] py-2">
              <Swiper
                spaceBetween={15}
                slidesPerView="auto"
                freeMode={true}
                className="mySwiper h-full"
              >
                {categoriesList.map((cat) => {
                  const targetCategory = cat.categoryId || cat.id;
                  // Handle "All Products" - go to /products without category param
                  const to = cat.path || (cat.id === 'all' ? '/products' : `/products?category=${encodeURIComponent(targetCategory)}`);
                  const isActive = cat.id === 'home'
                    ? location.pathname === '/'
                    : isProductsPage && (cat.id === 'all'
                      ? !activeCategory || activeCategory === 'all'
                      : activeCategory === targetCategory);
                  return (
                    <SwiperSlide key={cat.id} className="!w-auto flex items-center h-full">
                      <Link
                        to={to}
                        className={`
                  relative px-4 py-2 text-[14px] font-[500] 
                  text-beige 
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  group overflow-hidden
                  ${isActive
                            ? 'text-gold'
                            : 'hover:text-gold'
                          }
                `}
                      >
                        {/* Animated underline - slides in from left on hover */}
                        <span
                          className={`
                    absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-gold to-gold-light
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    shadow-[0_2px_4px_rgba(201,162,77,0.3)]
                    ${isActive
                              ? 'w-full opacity-100'
                              : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                            }
                  `}
                        />

                        {/* Text content */}
                        <span className="relative inline-block">
                          {cat.label}
                        </span>

                        {/* Active indicator dot - appears smoothly */}
                        {isActive && (
                          <span
                            className="absolute -top-0.5 right-1 w-1.5 h-1.5 bg-gold rounded-full opacity-100 transition-all duration-300"
                          />
                        )}
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Search Overlay - Full screen from top, covers everything */}
      {isSearchOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[150] flex flex-col"
          style={{ backgroundColor: '#0B0B0B' }}
        >
          {/* Backdrop - taps to close */}
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsSearchOpen(false);
              setShowResults(false);
            }}
            aria-hidden="true"
          />
          <div ref={searchBoxRef} className="relative z-10 w-full px-4 pt-6 pb-4 flex-shrink-0">
            <div className="w-full h-[50px] border border-woody rounded-md relative flex items-center bg-dark-base">
              <input
                type="text"
                ref={mobileSearchInputRef}
                placeholder="Search for products..."
                aria-label="Search for products"
                className="w-full h-full px-3 text-[15px] focus:outline-none text-beige placeholder-woody"
                style={{ backgroundColor: '#0B0B0B', opacity: 1 }}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 150);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setShowResults(false);
                    setIsSearchFocused(false);
                    setIsSearchOpen(false);
                    event.currentTarget.blur();
                  }
                }}
              />
              <button
                aria-label="Search"
                className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center text-beige hover:text-gold focus:outline-none transition-colors"
                onClick={() => {
                  if (searchQuery.trim().length >= MIN_QUERY_LENGTH) {
                    setShowResults(true);
                  }
                }}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gold text-[22px]" />
              </button>
              {/* Close mobile search */}
              <button
                aria-label="Close search"
                className="lg:hidden absolute right-12 w-9 h-9 rounded-full flex items-center justify-center text-beige hover:text-gold focus:outline-none transition-colors"
                onClick={() => {
                  setIsSearchOpen(false);
                  setShowResults(false);
                  setIsSearchFocused(false);
                }}
              >
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
                  <path d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95-95-95a24 24 0 0 0-34 34l95 95-95 95a24 24 0 1 0 34 34l95-95 95 95a24 24 0 0 0 34-34z"></path>
                </svg>
              </button>

              {showResults && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 border border-woody rounded-md shadow-lg max-h-80 overflow-y-auto z-[110] bg-[#0B0B0B]"
                  style={{ backgroundColor: '#0B0B0B' }}
                >
                  {isSearching && (
                    <div className="px-4 py-3 text-sm text-woody-light">Searching...</div>
                  )}

                  {!isSearching && searchError && (
                    <div className="px-4 py-3 text-sm text-woody-light">Unable to search products.</div>
                  )}

                  {!isSearching && !searchError && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-woody-light">No products found.</div>
                  )}

                  {!isSearching && !searchError && searchResults.length > 0 && (
                    <div className="py-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product._id}
                          to={`/product/${product._id}`}
                          onClick={handleSearchSelect}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-dark-light transition-colors"
                        >
                          <img
                            src={getProductImageUrl(product.image)}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover border border-woody flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-beige line-clamp-1">{product.name}</p>
                            {product.category && (
                              <p className="text-xs text-woody-light line-clamp-1">
                                {formatCategoryLabel(product.category)}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gold font-semibold whitespace-nowrap">
                            {product.price} EGP
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Spacer so overlay fills screen */}
          <div className="flex-1 min-h-0" />
        </div>
      )}

      {/* Bottom Tab Bar - Mobile Only */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t-2 border-gold rounded-t-3xl px-3 py-1.2 z-[100]"
        style={{ backgroundColor: '#0B0B0B', opacity: 1, boxShadow: '0 -4px 20px rgba(0,0,0,1)' }}
      >
        <div className="flex items-center justify-around h-[60px] px-2">
          {/* Customize Button */}
          <Link
            to="/customize"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors active:bg-dark-light rounded-lg focus:outline-none"
          >
            <FontAwesomeIcon
              icon={faCog}
              className={`text-[20px] transition-colors ${location.pathname === '/customize' ? 'text-gold' : 'text-beige'
                }`}
            />
            <span className={`text-[11px] font-medium transition-colors ${location.pathname === '/customize' ? 'text-gold' : 'text-beige'
              }`}>
              Customize
            </span>
          </Link>

          {/* Divider */}
          <div className="w-[1px] h-8 bg-woody"></div>

          {/* User Info or Login/Register */}
          {isAuthenticated() ? (
            <>
              <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-[20px] text-gold"
                />
                <span className="text-[11px] font-medium text-gold">
                  {user.firstName}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-woody"></div>
              <button
                onClick={logout}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors active:bg-dark-light rounded-lg focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faSignOut}
                  className="text-[20px] text-beige"
                />
                <span className="text-[11px] font-medium text-beige">
                  Logout
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors active:bg-dark-light rounded-lg focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faUser}
                  className={`text-[20px] transition-colors ${location.pathname === '/login' ? 'text-gold' : 'text-beige'
                    }`}
                />
                <span className={`text-[11px] font-medium transition-colors ${location.pathname === '/login' ? 'text-gold' : 'text-beige'
                  }`}>
                  Login
                </span>
              </Link>

              <div className="w-[1px] h-8 bg-woody"></div>

              <Link
                to="/register"
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors active:bg-dark-light rounded-lg focus:outline-none"
              >
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faUser}
                    className={`text-[20px] transition-colors ${location.pathname === '/register' ? 'text-gold' : 'text-beige'
                      }`}
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold rounded-full border border-dark-base"></span>
                </div>
                <span className={`text-[11px] font-medium transition-colors ${location.pathname === '/register' ? 'text-gold' : 'text-beige'
                  }`}>
                  Register
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>

  );

};

export default Navbar;
