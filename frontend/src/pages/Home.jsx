import React, { useState, useRef, useMemo, useCallback, useEffect, startTransition } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/common/ProductCard';
import Button from '../components/common/Button';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

// Progressive product carousel - renders 4 items initially, loads more on scroll
const ProgressiveProductSwiper = ({ items, swiperRef, getKey, renderSlide }) => {
  const INITIAL_RENDER_COUNT = 4;
  const BATCH_SIZE = 4;
  const PRELOAD_BUFFER = 2;

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_RENDER_COUNT, items.length)
  );
  const lastActiveIndexRef = useRef(-1);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const maybePreloadMore = useCallback((swiper) => {
    if (!swiper) return;

    const activeIndex = Number.isFinite(swiper.activeIndex) ? swiper.activeIndex : 0;
    if (activeIndex === lastActiveIndexRef.current) return;
    lastActiveIndexRef.current = activeIndex;

    if (activeIndex >= visibleCount - PRELOAD_BUFFER) {
      setVisibleCount((prev) => {
        if (prev >= items.length) return prev;
        if (activeIndex < prev - PRELOAD_BUFFER) return prev;
        return Math.min(prev + BATCH_SIZE, items.length);
      });
    }
  }, [visibleCount, items.length]);

  useEffect(() => {
    swiperRef?.current?.update?.();
  }, [visibleCount, swiperRef]);

  return (
    <Swiper
      modules={[FreeMode]}
      spaceBetween={10}
      slidesPerView="auto"
      freeMode={true}
      onSwiper={(swiper) => {
        if (swiperRef) swiperRef.current = swiper;
      }}
      onSlideChange={(swiper) => maybePreloadMore(swiper)}
      onProgress={(swiper) => maybePreloadMore(swiper)}
      onReachEnd={() => {
        // Fallback: if user reaches end quickly, ensure next batch is appended.
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, items.length));
      }}
      className="mySwiper"
    >
      {visibleItems.map((item, index) => (
        <SwiperSlide
          key={(getKey ? getKey(item) : (item?.id || item?._id || index))}
          style={{ width: 'auto', minWidth: '233px' }}
        >
          {renderSlide(item)}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

// Category section component - displays products for a specific category
const CategorySection = ({ category, products, renderProductCard, eager = false }) => {
  const categorySwiperRef = useRef(null);
  const categoryPrevRef = useRef(null);
  const categoryNextRef = useRef(null);
  const sectionRef = useRef(null);
  const [mountSwiper, setMountSwiper] = useState(Boolean(eager));

  // Lazy load swiper when section is near viewport (unless eager=true)
  useEffect(() => {
    if (eager) return undefined;
    const el = sectionRef.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMountSwiper(true);
          obs.disconnect();
        }
      },
      { rootMargin: '1200px 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);

  return (
    <section ref={sectionRef} className="py-3 lg:py-2 pt-0 bg-dark-base">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between gap-2">
          <h2 className="text-[20px] font-[600] text-gold">{category.name}</h2>
          <Link to={`/products?category=${category.slug}`} className="flex">
            <Button
              type="button"
              variant="viewAll"
              size="sm"
              icon={faArrowRight}
              iconPosition="right"
              className="!px-4 !py-2 !text-sm !font-medium"
            >
              View All
            </Button>
          </Link>
        </div>
        <div className="productsSlider pt-1 lg:pt-3 pb-0 relative">
          {mountSwiper ? (
            <>
              <ProgressiveProductSwiper
                items={products}
                swiperRef={categorySwiperRef}
                getKey={(p) => p?._id || p?.id}
                renderSlide={renderProductCard}
              />
              <Button
                ref={categoryPrevRef}
                variant="navigation"
                icon="prev"
                className="swiper-nav-btn swiper-nav-prev"
                aria-label="Previous slide"
                onClick={() => categorySwiperRef.current?.slidePrev()}
              />
              <Button
                ref={categoryNextRef}
                variant="navigation"
                icon="next"
                className="swiper-nav-btn swiper-nav-next"
                aria-label="Next slide"
                onClick={() => categorySwiperRef.current?.slideNext()}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  // Selected category filter for Popular Products section
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Staggered mounting phases to prevent long tasks
  // Phase 0: Hero only | Phase 1: Popular Products | Phase 2: Category sections | Phase 3: Banners
  const [mountPhase, setMountPhase] = useState(0);

  // Context hooks for API data
  const { getActiveCategories, getImageUrl } = useCategories();
  const { products: apiProducts, getProductImageUrl } = useProducts();

  // Refs for navigation buttons and swiper instances
  const heroSliderPrevRef = useRef(null);
  const heroSliderNextRef = useRef(null);
  const heroSwiperRef = useRef(null);
  const popularProductsPrevRef = useRef(null);
  const popularProductsNextRef = useRef(null);
  const popularProductsSwiperRef = useRef(null);

  // Hero slider images
  const heroImages = useMemo(
    () => [
      { base: '/images/hero-section-1', alt: 'Banner slide 1' },
      { base: '/images/hero-section-2', alt: 'Banner slide 2' },
      { base: '/images/hero-section-3', alt: 'Banner slide 3' },
    ],
    []
  );

  // Category slider items with image, name, and link
  const categorySliderItems = useMemo(() => {
    const activeCategories = getActiveCategories();
    return activeCategories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      image: getImageUrl(cat.image, { w: 180, format: 'webp', q: 75 }),
      link: `/products?category=${cat.slug}`
    }));
  }, [getActiveCategories, getImageUrl]);

  // Active categories and products (status = Active only)
  const activeCategories = useMemo(() => getActiveCategories(), [getActiveCategories]);
  const activeProducts = useMemo(() => apiProducts.filter((p) => p.status === 'Active'), [apiProducts]);

  // Map products by category slug for quick filtering
  const productsByCategory = useMemo(() => {
    const map = new Map();
    for (const p of activeProducts) {
      const key = p.category;
      if (!key) continue;
      const arr = map.get(key);
      if (arr) arr.push(p);
      else map.set(key, [p]);
    }
    return map;
  }, [activeProducts]);

  // Transform API product to ProductCard format
  const toProductCardModel = useCallback((product) => {
    const variantTotal = Array.isArray(product.variants)
      ? product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
      : 0;
    const fallbackStock = product.stock || 0;
    const legacyAvailable = variantTotal > 0 ? 0 : fallbackStock;
    const inStock = variantTotal > 0 || legacyAvailable > 0;

    return {
      ...product,
      id: product._id,
      image: getProductImageUrl(product.image, { w: 420, format: 'webp', q: 75 }),
      images: product.images
        ? product.images.map((img) => getProductImageUrl(img, { w: 420, format: 'webp', q: 75 }))
        : [getProductImageUrl(product.image, { w: 420, format: 'webp', q: 75 })],
      hoverImage: product.images && product.images.length > 1
        ? getProductImageUrl(product.images[1], { w: 420, format: 'webp', q: 75 })
        : null,
      brand: product.brand || 'Brand',
      inStock,
      reviewCount: 0
    };
  }, [getProductImageUrl]);

  // Render product card component
  const renderProductCard = useCallback((rawProduct) => {
    return <ProductCard product={toProductCardModel(rawProduct)} />;
  }, [toProductCardModel]);

  // Filter products for Popular Products section
  const popularProducts = useMemo(() => {
    if (selectedCategory === 'all') return activeProducts;
    return productsByCategory.get(selectedCategory) || [];
  }, [selectedCategory, activeProducts, productsByCategory]);

  // Banner slides data (last section on page)
  const bannerSlides = useMemo(
    () => [
      {
        id: 'banner-1',
        base: '/images/b-1',
        link: '/products?catId=67cfa3233c7fa6b8e3276e3d'
      },
      {
        id: 'banner-2',
        base: '/images/b-3',
        link: '/products?catId=69048d4e228db479bb634aa4'
      },
      {
        id: 'banner-3',
        base: '/images/b-4',
        link: '/products?subCatId=690498a5228db479bb63d529'
      },
      {
        id: 'banner-4',
        base: '/images/b-2',
        link: '/products?catId=690498a5228db479bb63d529'
      }
    ],
    []
  );

  // Staggered mounting to prevent long tasks
  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      startTransition(() => setMountPhase(1));
      requestAnimationFrame(() => {
        if (cancelled) return;
        startTransition(() => setMountPhase(2));
        requestAnimationFrame(() => {
          if (cancelled) return;
          startTransition(() => setMountPhase(3));
        });
      });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-dark-base">
      {/* Hero Section - Main banner slider */}
      <div className="homeSlider mt-[120px] sm:mt-[130px] lg:mt-0 pb-3 pt-3 lg:pb-5 lg:pt-5 relative z-10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={10}
            slidesPerView={1}
            onSwiper={(swiper) => {
              heroSwiperRef.current = swiper;
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            loop={false}
            className="sliderHome rounded-[10px] overflow-hidden"
          >
            {heroImages.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="item rounded-[10px] overflow-hidden h-[180px] sm:h-[220px] md:h-[320px] xl:h-[420px] flex justify-center items-center bg-dark-base">
                  <img
                    src={`${image.base}-1200w.webp`}
                    srcSet={`${image.base}-480w.webp 480w, ${image.base}-768w.webp 768w, ${image.base}-1200w.webp 1200w`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
                    width="1200"
                    height="800"
                    alt={image.alt}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding={index === 0 ? 'sync' : 'async'}
                  />
                </div>
              </SwiperSlide>
            ))}

          </Swiper>
          <Button
            ref={heroSliderPrevRef}
            variant="navigation"
            icon="prev"
            className="swiper-nav-btn swiper-nav-prev"
            aria-label="Previous slide"
            onClick={() => heroSwiperRef.current?.slidePrev()}
          />
          <Button
            ref={heroSliderNextRef}
            variant="navigation"
            icon="next"
            className="swiper-nav-btn swiper-nav-next"
            aria-label="Next slide"
            onClick={() => heroSwiperRef.current?.slideNext()}
          />
        </div>
      </div>

      {/* Categories Slider - Horizontal category icons */}
      {categorySliderItems.length > 0 && (
        <div className="homeCatSlider pt-0 lg:pt-4 py-4 lg:py-8">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Swiper
              modules={[FreeMode]}
              spaceBetween={8}
              slidesPerView="auto"
              freeMode={true}
              className="mySwiper"
            >
              {categorySliderItems.map((category, index) => (
                <SwiperSlide key={category.id} style={{ width: '180px', flexShrink: 0 }}>
                  <Link to={category.link} aria-label={category.name}>
                    <div className="item w-full h-[150px] sm:h-[165px] bg-dark-light border border-woody rounded-sm text-center flex items-center justify-center flex-col gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.3)] hover:border-gold transition-colors">
                      <div className="w-[80px] h-[80px] lg:w-[90px] lg:h-[90px] flex items-center justify-center overflow-hidden">
                        <img
                          src={category.image}
                          alt=""
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding={index === 0 ? 'sync' : 'async'}
                        />
                      </div>
                      <h3 className="text-[12px] lg:text-[15px] font-[500] leading-tight px-2 text-beige">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {/* Popular Products Section - Filterable product carousel */}
      {mountPhase >= 1 && activeProducts.length > 0 && (
      <section className="bg-dark-base py-3 lg:py-8">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-col lg:flex-row mb-4">
            <div className="leftSec w-full lg:w-[40%] mb-4 lg:mb-0">
              <h2 className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-[600] text-gold">
                Popular Products
              </h2>
              <p className="text-[12px] sm:text-[14px] md:text-[13px] lg:text-[14px] font-[400] mt-0 mb-0 text-beige">
                Do not miss the current offers until the end of March.
              </p>
            </div>
            <div className="rightSec w-full lg:w-[60%]">
              {/* Category filter - Mobile swiper */}
              <div className="lg:hidden">
                <Swiper
                  modules={[FreeMode]}
                  spaceBetween={16}
                  slidesPerView="auto"
                  freeMode={{
                    enabled: true,
                    sticky: false,
                    momentumRatio: 0.5,
                    momentumVelocityRatio: 0.5,
                  }}
                  touchEventsTarget="container"
                  touchRatio={1}
                  resistance={true}
                  resistanceRatio={0.85}
                  className="categoryFilterSwiper"
                >
                  <SwiperSlide style={{ width: 'auto' }}>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-0 py-2 text-[14px] font-[500] whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none focus:outline-none focus-visible:outline-none active:outline-none overflow-hidden group ${selectedCategory === 'all'
                        ? 'text-gold'
                        : 'text-beige hover:text-gold'
                        }`}
                    >
                      <span className="relative inline-block">
                        All
                      </span>
                      <span
                        className={`
                          absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-gold to-gold-light
                          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                          shadow-[0_2px_4px_rgba(201,162,77,0.3)]
                          ${selectedCategory === 'all'
                            ? 'w-full opacity-100'
                            : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                          }
                        `}
                      />
                    </button>
                  </SwiperSlide>
                  {getActiveCategories().map((category) => (
                    <SwiperSlide key={category._id} style={{ width: 'auto' }}>
                      <button
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`px-0 py-2 text-[14px] font-[500] whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none focus:outline-none focus-visible:outline-none active:outline-none overflow-hidden group ${selectedCategory === category.slug
                          ? 'text-gold'
                          : 'text-beige hover:text-gold'
                          }`}
                      >
                        <span className="relative inline-block">
                          {category.name}
                        </span>
                        <span
                          className={`
                            absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-gold to-gold-light
                            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                            shadow-[0_2px_4px_rgba(201,162,77,0.3)]
                            ${selectedCategory === category.slug
                              ? 'w-full opacity-100'
                              : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                            }
                          `}
                        />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              {/* Category filter - Desktop flex layout */}
              <div className="hidden lg:flex items-center justify-end gap-4 lg:gap-6">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-0 py-2 text-[14px] font-[500] whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none focus:outline-none focus-visible:outline-none active:outline-none overflow-hidden group ${selectedCategory === 'all'
                    ? 'text-gold'
                    : 'text-beige hover:text-gold'
                    }`}
                >
                  <span className="relative inline-block">
                    All
                  </span>
                  <span
                    className={`
                      absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-gold to-gold-light
                      transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                      shadow-[0_2px_4px_rgba(201,162,77,0.3)]
                      ${selectedCategory === 'all'
                        ? 'w-full opacity-100'
                        : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                      }
                    `}
                  />
                </button>
                {getActiveCategories().map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`px-0 py-2 text-[14px] font-[500] whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none focus:outline-none focus-visible:outline-none active:outline-none overflow-hidden group ${selectedCategory === category.slug
                      ? 'text-gold'
                      : 'text-beige hover:text-gold'
                      }`}
                  >
                    <span className="relative inline-block">
                      {category.name}
                    </span>
                    <span
                      className={`
                        absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-gold to-gold-light
                        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                        shadow-[0_2px_4px_rgba(201,162,77,0.3)]
                        ${selectedCategory === category.slug
                          ? 'w-full opacity-100'
                          : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                        }
                      `}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="min-h-0">
            <div className="productsSlider pt-1 lg:pt-3 pb-0 relative">
              <ProgressiveProductSwiper
                key={`popular:${selectedCategory}`}
                items={popularProducts}
                swiperRef={popularProductsSwiperRef}
                getKey={(p) => p?._id || p?.id}
                renderSlide={renderProductCard}
              />
              <Button
                ref={popularProductsPrevRef}
                variant="navigation"
                icon="prev"
                className="swiper-nav-btn swiper-nav-prev"
                aria-label="Previous slide"
                onClick={() => popularProductsSwiperRef.current?.slidePrev()}
              />
              <Button
                ref={popularProductsNextRef}
                variant="navigation"
                icon="next"
                className="swiper-nav-btn swiper-nav-next"
                aria-label="Next slide"
                onClick={() => popularProductsSwiperRef.current?.slideNext()}
              />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Category Sections - One section per category with products */}
      {mountPhase >= 2 && activeProducts.length > 0 &&
        activeCategories
          .filter((category) => (productsByCategory.get(category.slug) || []).length > 0)
          .map((category, index) => {
            const categoryProductsList = productsByCategory.get(category.slug) || [];
            if (categoryProductsList.length === 0) return null;

            return (
              <CategorySection
                key={category._id}
                category={category}
                products={categoryProductsList}
                renderProductCard={renderProductCard}
                eager={index < 2}
              />
            );
          })
      }

      {/* Banners Section - Promotional banners with infinite scroll (last section) */}
      {mountPhase >= 3 && (
        <section className="py-5 w-full overflow-hidden">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="banner-infinite-scroll">
              <div className="banner-scroll-wrapper">
                {/* First set of banners */}
                {bannerSlides.map((banner) => (
                  <div key={banner.id} className="banner-slide-item">
                    <div className="box bannerBox overflow-hidden rounded-lg group w-full">
                      <Link to={banner.link} className="text-[16px] font-[600] link block w-full">
                        <img
                          src={`${banner.base}-768w.webp`}
                          srcSet={`${banner.base}-480w.webp 480w, ${banner.base}-768w.webp 768w, ${banner.base}-1200w.webp 1200w`}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          width="559"
                          height="294"
                          alt="Promotional banner"
                          className="w-full h-auto transition-all group-hover:scale-105 group-hover:rotate-1"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    </div>
                  </div>
                ))}
                {/* Duplicate set for seamless infinite scroll */}
                {bannerSlides.map((banner) => (
                  <div key={`${banner.id}-duplicate`} className="banner-slide-item">
                    <div className="box bannerBox overflow-hidden rounded-lg group w-full">
                      <Link to={banner.link} className="text-[16px] font-[600] link block w-full">
                        <img
                          src={`${banner.base}-768w.webp`}
                          srcSet={`${banner.base}-480w.webp 480w, ${banner.base}-768w.webp 768w, ${banner.base}-1200w.webp 1200w`}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          width="559"
                          height="294"
                          alt="Promotional banner"
                          className="w-full h-auto transition-all group-hover:scale-105 group-hover:rotate-1"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;