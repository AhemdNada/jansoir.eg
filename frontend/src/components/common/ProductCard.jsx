import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import FavoriteHeart from './FavoriteHeart';

const ProductCard = ({ product }) => {
  const discount = useMemo(() => {
    if (!product.originalPrice || product.originalPrice <= 0) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }, [product.originalPrice, product.price]);

  const fallbackHoverImage = product.images && product.images.length > 1 ? product.images[1] : null;

  return (
    <div className="productItem group shadow-lg rounded-md overflow-hidden border border-woody bg-dark-light transition-transform duration-200 hover:-translate-y-0.5 hover:border-gold">
      <div className="imgWrapper w-full overflow-hidden rounded-md rounded-bl-none rounded-br-none relative">
        <Link to={product.link || `/product/${product.id}`} aria-label={product.name}>
          <div className="img h-[200px] overflow-hidden relative">
            <img
              src={product.image}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 233px"
            />
            {(product.hoverImage || fallbackHoverImage) && (
              <img
                src={product.hoverImage || fallbackHoverImage}
                alt=""
                className="w-full h-full object-cover transition-all duration-700 absolute top-0 left-0 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </Link>
        {discount > 0 && (
          <span className="discount flex items-center absolute top-[10px] left-[10px] z-50 bg-woody text-beige rounded-lg px-2 py-1 text-[13px] font-[700] border-2 border-gold shadow-lg">
            {discount}% OFF
          </span>
        )}
        <div className="actions absolute top-3 right-[5px] z-50 flex items-center gap-2 flex-col w-[50px] transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <FavoriteHeart product={product} />
        </div>
      </div>
      <div className="info p-3 py-5 bg-dark-base">
        <p className="text-[13px] font-[500] text-beige transition-colors duration-200 group-hover:text-gold">
          <span className="link">{product.brand || 'Brand'}</span>
        </p>
        <h3 className="text-[13px] lg:text-[14px] title mt-1 font-[600] mb-1 text-beige leading-tight transition-colors duration-200 group-hover:text-gold">
          <Link to={product.link || `/product/${product.id}`} className="link" title={product.name}>
            {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-4 justify-between mb-3">
          {product.originalPrice && (
            <span className="oldPrice line-through text-beige/70 text-[12px] lg:text-[13px] font-[500]">
              {product.originalPrice.toFixed(2)} EGP
            </span>
          )}
          <span className="price text-gold text-[15px] lg:text-[16px] font-[700]">
            {product.price.toFixed(2)} EGP
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);