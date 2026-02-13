import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import Rating from '../components/common/Rating';
import Button from '../components/common/Button';
import ProductCard from '../components/common/ProductCard';
import FavoriteHeart from '../components/common/FavoriteHeart';
import { productApi } from '../api/productApi';
import { trackEvent } from '../analytics/analyticsClient';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products: apiProducts, getProductImageUrl, ensureFreshProducts } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addError, setAddError] = useState('');
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const trackedProductRef = useRef(null);
  const thumbnailsRef = useRef([]);
  const touchStartXRef = useRef(null);

  // Reset scroll on product change to avoid mid-page landing
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  // Always fetch by ID to ensure deep links and freshness
  useEffect(() => {
    let isActive = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setLoadError('');
        await ensureFreshProducts();
        const data = await productApi.getProduct(id);
        if (!isActive) return;
        setProductData(data.data);
      } catch (err) {
        if (!isActive) return;
        setLoadError(err.message || 'Product not found');
        setProductData(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchProduct();
    return () => { isActive = false; };
  }, [id, ensureFreshProducts]);

  const product = useMemo(() => {
    const source = productData || apiProducts.find(p => p._id === id);
    if (!source) return null;
    
    // Ensure images array has at least one image
    const productImages = source.images && source.images.length > 0 
      ? source.images.map(img => getProductImageUrl(img))
      : [getProductImageUrl(source.image)];

    const variantTotal = Array.isArray(source.variants)
      ? source.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
      : 0;
    const fallbackStock = source.stock || 0; // legacy only when no variants
    const legacyAvailable = variantTotal > 0 ? 0 : fallbackStock;
    const inStockDerived = variantTotal > 0 || legacyAvailable > 0;
    
    return {
      ...source,
      id: source._id,
      image: getProductImageUrl(source.image),
      images: productImages,
      inStock: inStockDerived,
      reviewCount: 0,
      keyFeatures: source.keyFeatures || [],
      sizes: source.sizes || [],
      colors: source.colors || [],
      variants: source.variants || [],
      legacyStock: legacyAvailable
    };
  }, [apiProducts, id, getProductImageUrl, productData]);

  const safeNumber = (n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  };

  // Track product view once per product id
  useEffect(() => {
    if (!product || loading) return;
    if (trackedProductRef.current === product.id) return;
    trackedProductRef.current = product.id;
    trackEvent('product_view', {
      productId: product.id,
      category: product.category || '',
      price: safeNumber(product.price),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, loading]);

  useEffect(() => {
    // Ensure active thumbnail is always visible in the strip
    if (!product || !thumbnailsRef.current[selectedImage]) return;
    try {
      thumbnailsRef.current[selectedImage].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    } catch {
      // ignore scroll errors
    }
  }, [selectedImage, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    
    return apiProducts
      .filter(p => p.status === 'Active' && p.category === product.category && p._id !== product.id)
      .slice(0, 4)
      .map(p => {
        const variantTotal = Array.isArray(p.variants)
          ? p.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
          : 0;
        const fallbackStock = p.stock || 0; // legacy only when no variants
        const legacyAvailable = variantTotal > 0 ? 0 : fallbackStock;
        const inStockDerived = variantTotal > 0 || legacyAvailable > 0;
        return {
          ...p,
          id: p._id,
          image: getProductImageUrl(p.image),
          images: p.images ? p.images.map(img => getProductImageUrl(img)) : [getProductImageUrl(p.image)],
          inStock: inStockDerived,
          reviewCount: 0
        };
      });
  }, [product, apiProducts, getProductImageUrl]);

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;
  const requiresSize = hasVariants ? variants.some(v => v.size) : (product?.sizes?.length > 0);
  const requiresColor = hasVariants ? variants.some(v => v.color) : (product?.colors?.length > 0);

  const sizeOptions = useMemo(() => {
    if (hasVariants) {
      const sizes = variants.map(v => v.size || '').filter(Boolean);
      return Array.from(new Set(sizes));
    }
    return product?.sizes || [];
  }, [hasVariants, variants, product?.sizes]);

  const sizeAvailability = useMemo(() => {
    if (!hasVariants) return {};
    return variants.reduce((acc, v) => {
      const key = v.size || '';
      acc[key] = (acc[key] || 0) + (Number(v.quantity) || 0);
      return acc;
    }, {});
  }, [hasVariants, variants]);

  const colorOptions = useMemo(() => {
    if (!requiresColor) return [];
    if (hasVariants) {
      if (requiresSize && !selectedSize) {
        return [];
      }
      const filtered = requiresSize && selectedSize
        ? variants.filter(v => (v.size || '') === selectedSize)
        : variants;
      const colors = filtered.map(v => v.color || '').filter(Boolean);
      return Array.from(new Set(colors));
    }
    return product?.colors || [];
  }, [hasVariants, variants, requiresColor, requiresSize, selectedSize, product?.colors]);

  const colorAvailability = useMemo(() => {
    if (!hasVariants) return {};
    const scoped = requiresSize && selectedSize
      ? variants.filter(v => (v.size || '') === selectedSize)
      : (requiresSize ? [] : variants);
    return scoped.reduce((acc, v) => {
      const key = v.color || '';
      acc[key] = (acc[key] || 0) + (Number(v.quantity) || 0);
      return acc;
    }, {});
  }, [hasVariants, variants, requiresSize, selectedSize]);

  const sizeMatchedVariants = useMemo(() => {
    if (!hasVariants || !selectedSize) return [];
    return variants.filter(v => (v.size || '') === selectedSize);
  }, [hasVariants, variants, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find(v => {
      const sizeOk = !requiresSize || (v.size || '') === selectedSize;
      const colorOk = !requiresColor || (v.color || '') === selectedColor;
      return sizeOk && colorOk;
    }) || null;
  }, [hasVariants, variants, requiresSize, requiresColor, selectedSize, selectedColor]);

  const selectedVariantStock = selectedVariant ? Number(selectedVariant.quantity) || 0 : 0;
  const selectedVariantOutOfStock = selectedVariant ? (Number(selectedVariant.quantity) || 0) <= 0 : false;

  const displayedPrice = useMemo(() => {
    if (!hasVariants) return product?.price ?? null;
    if (selectedVariant && Number.isFinite(Number(selectedVariant.price))) {
      return Number(selectedVariant.price);
    }
    if (requiresSize && selectedSize && sizeMatchedVariants.length > 0) {
      const prices = sizeMatchedVariants
        .map(v => Number(v.price))
        .filter(p => Number.isFinite(p) && p > 0);
      return prices.length ? Math.min(...prices) : null;
    }
    if (!requiresSize && requiresColor && selectedColor) {
      const colorMatches = variants.filter(v => (v.color || '') === selectedColor);
      const prices = colorMatches
        .map(v => Number(v.price))
        .filter(p => Number.isFinite(p) && p > 0);
      return prices.length ? Math.min(...prices) : null;
    }
    return product?.price ?? null;
  }, [
    hasVariants,
    product?.price,
    selectedVariant,
    requiresSize,
    selectedSize,
    sizeMatchedVariants,
    requiresColor,
    selectedColor,
    variants
  ]);

  const selectionMismatch = hasVariants && (
    (requiresSize && selectedSize && sizeMatchedVariants.length === 0) ||
    (requiresColor && selectedColor && !selectedVariant && (!requiresSize || selectedSize))
  );

  useEffect(() => {
    setAddError('');
    setQuantity(1);
  }, [selectedSize, selectedColor]);

  useEffect(() => {
    if (requiresSize && selectedSize && sizeOptions.length > 0 && !sizeOptions.includes(selectedSize)) {
      setSelectedSize('');
    }
  }, [requiresSize, selectedSize, sizeOptions]);

  useEffect(() => {
    if (requiresColor && selectedColor && colorOptions.length > 0 && !colorOptions.includes(selectedColor)) {
      setSelectedColor('');
    }
  }, [requiresColor, selectedColor, colorOptions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-base">
        <div className="text-center text-beige">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-base">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gold mb-4">Product Not Found</h1>
          {loadError && <p className="text-beige mb-3">{loadError}</p>}
          <Link to="/products" className="text-gold hover:text-gold-light focus:outline-none">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setAddError('');
    if (requiresSize && !selectedSize) {
      setAddError('Please select a size.');
      return;
    }
    if (requiresColor && !selectedColor) {
      setAddError('Please select a color.');
      return;
    }
    if (selectionMismatch) {
      setAddError('Selected variant is not available.');
      return;
    }
    if (selectedVariantOutOfStock) {
      setAddError('Selected size is out of stock.');
      return;
    }
    const availableStock = selectedVariantStock ?? product.legacyStock ?? Infinity;
    const clampedQty = Math.min(quantity, availableStock);
    const resolvedPrice = Number.isFinite(Number(displayedPrice))
      ? Number(displayedPrice)
      : product.price;

    const value = safeNumber(resolvedPrice) * safeNumber(clampedQty);
    trackEvent('add_to_cart', {
      productId: product.id,
      category: product.category || '',
      quantity: clampedQty,
      price: safeNumber(resolvedPrice),
      value,
      size: selectedSize || '',
      color: selectedColor || '',
    });

    const payload = {
      ...product,
      price: resolvedPrice,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variantStock: selectedVariantStock ?? undefined,
      availableStock
    };
    for (let i = 0; i < clampedQty; i++) {
      addToCart(payload);
    }
  };

  const handleNextImage = () => {
    if (!product || !product.images?.length) return;
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    if (!product || !product.images?.length) return;
    setSelectedImage((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-dark-base pt-[140px] sm:pt-[160px] lg:pt-24 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/" className="text-woody hover:text-gold focus:outline-none transition-colors">Home</Link>
            </li>
            <li>
              <span className="text-woody">/</span>
              <Link to="/products" className="ml-4 text-woody hover:text-gold focus:outline-none transition-colors">Products</Link>
            </li>
            <li>
              <span className="text-woody">/</span>
              <span className="ml-4 text-beige font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div>
            <div
              className="mb-4 relative"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current == null) return;
                const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
                const threshold = 40; // minimum swipe distance
                if (diffX > threshold) {
                  handlePrevImage();
                } else if (diffX < -threshold) {
                  handleNextImage();
                }
                touchStartXRef.current = null;
              }}
            >
              <img
                key={selectedImage}
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-2xl shadow-lg transition-all duration-300 ease-out animate-fade-in"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="relative mt-2">
              {product.images.length > 1 && (
                <>
                <button
                  type="button"
                  aria-label="Previous thumbnail"
                  onClick={handlePrevImage}
                  className="
                    absolute left-2 top-1/2 -translate-y-1/2 z-20 
                    w-10 h-10 rounded-full 
                    bg-gradient-to-br from-yellow-400 to-yellow-500
                    text-dark-base 
                    flex items-center justify-center 
                    shadow-lg
                    hover:scale-110 hover:shadow-xl 
                    transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-yellow-300
                  "
                >
                  ‹
                </button>
              
                <button
                  type="button"
                  aria-label="Next thumbnail"
                  onClick={handleNextImage}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2 z-20 
                    w-10 h-10 rounded-full 
                    bg-gradient-to-br from-yellow-400 to-yellow-500
                    text-dark-base 
                    flex items-center justify-center 
                    shadow-lg
                    hover:scale-110 hover:shadow-xl 
                    transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-yellow-300
                  "
                >
                  ›
                </button>
              </>
              
              )}
              <div className="flex gap-3 overflow-x-auto lg:overflow-visible py-1 px-8 sm:px-10 lg:px-0">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    ref={(el) => (thumbnailsRef.current[index] = el)}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 focus:outline-none transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-gold scale-[1.02]'
                        : 'border-woody hover:border-gold'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
              <span className="inline-block bg-gold/20 text-gold border border-gold px-3 py-1 rounded-full text-sm font-semibold">
                {product.category}
              </span>
              </div>
              <FavoriteHeart product={product} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gold mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-gold">
                  {Number.isFinite(Number(displayedPrice)) ? Number(displayedPrice).toFixed(2) : 'N/A'} EGP
                </span>
                {!selectedVariant && product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-beige/70 line-through">{product.originalPrice.toFixed(2)} EGP</span>
                    <span className="bg-woody/40 text-gold border-2 border-gold px-3 py-1.5 rounded text-sm font-bold shadow-md">
                      Save {(product.originalPrice - product.price).toFixed(2)} EGP
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-beige mb-8 text-lg leading-relaxed">
              {product.description}
            </p>

            {/* Key Features */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gold mb-4">Key Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.keyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-beige">
                      <svg className="w-5 h-5 text-gold mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variants */}
            {(requiresSize || requiresColor) && (
              <div className="mb-8 space-y-4">
                <h3 className="text-lg font-semibold text-gold">Select Options</h3>

                {requiresSize && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-beige">Size</p>
                    <div className="flex flex-wrap gap-3">
                      {sizeOptions.map((size) => {
                        const isActive = selectedSize === size;
                        const stockForSize = hasVariants ? (sizeAvailability[size] || 0) : null;
                        const isOutOfStock = hasVariants && stockForSize <= 0;
                        return (
                          <button
                            key={`size-${size}`}
                            onClick={() => {
                              setSelectedSize(size);
                              if (requiresColor) {
                                setSelectedColor('');
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-0 ${
                              isActive
                                ? 'border-gold bg-gold/20 text-gold'
                                : 'border-woody text-beige hover:border-gold hover:text-gold'
                            } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {size}
                            {hasVariants && (
                              <div className="text-xs text-woody mt-1 text-center">
                                {isOutOfStock ? 'Out of stock' : `(${stockForSize})`}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {requiresColor && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-beige">Color</p>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.length === 0 && requiresSize && (
                        <span className="text-xs text-woody">Select a size to see available colors.</span>
                      )}
                      {colorOptions.map((color) => {
                        const isActive = selectedColor === color;
                        const stockForColor = hasVariants ? (colorAvailability[color] || 0) : null;
                        const isOutOfStock = hasVariants && stockForColor <= 0;
                        return (
                          <button
                            key={`color-${color}`}
                            onClick={() => setSelectedColor(color)}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-0 ${
                              isActive
                                ? 'border-gold bg-gold/20 text-gold'
                                : 'border-woody text-beige hover:border-gold hover:text-gold'
                            } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {color}
                            {hasVariants && (
                              <div className="text-xs text-woody mt-1 text-center">
                                {isOutOfStock ? 'Out of stock' : `(${stockForColor})`}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectionMismatch && (
                  <div className="text-gold text-sm">Selected variant is not available.</div>
                )}
                {selectedVariantOutOfStock && (
                  <div className="text-gold text-sm">Selected size is out of stock.</div>
                )}
                {addError && (
                  <div className="text-gold text-sm">{addError}</div>
                )}
              </div>
            )}

            {/* Add to Cart */}
            <div className="border-t border-woody pt-8">
              <div className="flex items-center space-x-4 mb-6">
                <label htmlFor="quantity" className="text-lg font-semibold text-gold">Quantity:</label>
                <div className="flex items-center border border-woody rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-beige hover:text-gold focus:outline-none transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-beige font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => {
                      const maxStock = selectedVariantStock ?? product.legacyStock ?? Infinity;
                      return Math.min(prev + 1, maxStock);
                    })}
                    className="px-4 py-2 text-beige hover:text-gold focus:outline-none transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-row space-x-2 sm:space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={
                    !product.inStock ||
                    (requiresSize && !selectedSize) ||
                    (requiresColor && !selectedColor) ||
                    selectionMismatch ||
                    selectedVariantOutOfStock
                  }
                  variant="outline"
                  size="lg"
                  className="flex-1 text-sm sm:text-lg px-3 py-2 sm:px-6 sm:py-3"
                >
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                
              </div>
            </div>

            
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-woody pt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;