import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { useFavorites } from '../../context/FavoriteContext';

const FavoriteHeart = ({ product, productId, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = product?.id || product?._id || productId;
  const active = id ? isFavorite(id) : false;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    toggleFavorite(product || { id });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle favorite"
      aria-pressed={active}
      className={`focus:outline-none focus:ring-0 w-[35px] h-[35px] min-w-[35px] rounded-full transition-colors flex items-center justify-center shadow-md border ${active ? 'bg-primary text-white border-primary' : 'bg-white text-black border-black hover:border-primary hover:bg-white'} ${className}`}
    >
      <FontAwesomeIcon
        icon={active ? faHeartSolid : faHeartOutline}
        className={`text-[18px] ${active ? '' : 'text-black'}`}
      />
    </button>
  );
};

export default FavoriteHeart;

