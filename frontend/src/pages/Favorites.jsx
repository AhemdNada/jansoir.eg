import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import Button from '../components/common/Button';
import { useFavorites } from '../context/FavoriteContext';
import { getProductImageUrl } from '../api/productApi';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const Favorites = () => {
  const { favorites, loading, error } = useFavorites();

  const items = useMemo(() => {
    return favorites
      .map(fav => {
        const product = fav.product || {};
        const id = product._id || product.id || fav.productId;
        if (!id) return null;
        return {
          ...product,
          id,
          image: getProductImageUrl(product.image),
          images: Array.isArray(product.images) ? product.images.map(getProductImageUrl) : product.image ? [getProductImageUrl(product.image)] : [],
          link: `/product/${id}`,
        };
      })
      .filter(Boolean);
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-base mt-[120px] lg:mt-[40px]">
        <p className="text-beige text-sm">Loading favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-base mt-[120px] lg:mt-[40px]">
        <div className="bg-woody/30 border border-gold px-4 py-3 rounded text-gold text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-base mt-[120px] lg:mt-[40px] pb-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold text-gold">My Favorites</h1>
            <p className="text-sm text-beige mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Link to="/products" className="hidden sm:block">
            <Button
              variant="viewAll"
              size="sm"
              icon={faArrowRight}
              iconPosition="right"
              className="!px-4 !py-2 !text-sm !font-medium"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-dark-light border border-woody rounded-lg p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gold">No favorites yet</h3>
            <p className="text-sm text-beige mt-2">Tap the heart icon on any product to save it here.</p>
            <Link to="/products" className="inline-block mt-4">
              <Button
                variant="viewAll"
                size="sm"
                icon={faArrowRight}
                iconPosition="right"
                className="!px-4 !py-2 !text-sm !font-medium"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

