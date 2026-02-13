import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette } from '@fortawesome/free-solid-svg-icons';

const CustomizeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show button on admin pages or customize page itself
  if (location.pathname.startsWith('/admin') || location.pathname === '/customize') {
    return null;
  }

  const handleClick = () => {
    navigate('/customize');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 
                 bg-gold text-dark-base 
                 font-semibold py-4 px-1 
                 shadow-lg
                 rounded-r-lg
                 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-dark-base
                 hidden md:block"
      aria-label="Customize Product"
    >
      <div className="flex flex-col items-center gap-1">
        <FontAwesomeIcon icon={faPalette} className="text-sm" />
        <span 
          className="text-[17px] tracking-wider block"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          Customize
        </span>
      </div>
    </button>
  );
};

export default CustomizeButton;

