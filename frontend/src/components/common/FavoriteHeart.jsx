import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { useFavorites } from '../../context/FavoriteContext';

const FavoriteHeart = ({ product, productId, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = product?.id || product?._id || productId;
  const active = id ? isFavorite(id) : false;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 2800);
    return () => clearTimeout(t);
  }, [showToast]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    toggleFavorite(product || { id });
    setToastMessage(active ? 'Removed from favorites' : 'Added to favorites');
    setShowToast(true);
  };

  const toast = (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-24 right-6 left-auto z-[150] px-5 py-3 rounded-xl shadow-xl border border-gold/40 bg-dark-light text-gold font-semibold text-sm sm:text-base transition-all duration-300 ease-out ${
        showToast
          ? 'opacity-100 translate-x-0 visible'
          : 'opacity-0 translate-x-4 invisible pointer-events-none'
      }`}
    >
      <span className="flex items-center gap-2">
        <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {toastMessage}
      </span>
    </div>
  );

  return (
    <>
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
      {createPortal(toast, document.body)}
    </>
  );
};

export default FavoriteHeart;

