import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/common/ProductCard';

const Products = () => {
  const { getActiveCategories } = useCategories();
  const { products: apiProducts, getProductImageUrl } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('name');

  // Max price for filter
  const maxPrice = 20000;

  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Map API products to match the format expected by ProductCard
  const allProducts = useMemo(() => {
    return apiProducts
      .filter(p => p.status === 'Active')
      .map(p => {
        const variantTotal = Array.isArray(p.variants)
          ? p.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
          : 0;
        const fallbackStock = p.stock || 0; // legacy only when no variants
        const legacyAvailable = variantTotal > 0 ? 0 : fallbackStock;
        const inStock = variantTotal > 0 || legacyAvailable > 0;
        return {
          ...p,
          id: p._id,
          image: getProductImageUrl(p.image),
          images: p.images ? p.images.map(img => getProductImageUrl(img)) : [getProductImageUrl(p.image)],
          hoverImage: p.images && p.images.length > 1 ? getProductImageUrl(p.images[1]) : null,
          inStock,
          reviewCount: 0
        };
      });
  }, [apiProducts, getProductImageUrl]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by category - match by slug
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
      filtered = filtered.filter(product => {
        // Check if product category matches any selected category slug
        return selectedCategories.some(selectedSlug => 
          product.category === selectedSlug
        );
      });
    }

    // Filter by price range
    filtered = filtered.filter(product =>

      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    const sortedFiltered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sortedFiltered;
  }, [allProducts, selectedCategories, priceRange, sortBy]);

  // Sync with URL when it changes from Navbar links
  // Navbar links set a single category (independent from sidebar filters)
  // Sidebar filters work independently and allow multiple selections
  const urlCategoryRef = useRef(searchParams.get('category'));

  useEffect(() => {
    const urlCategory = searchParams.get('category');

    // Only update if URL category actually changed (from Navbar click)
    if (urlCategoryRef.current !== urlCategory) {
      urlCategoryRef.current = urlCategory;

      if (urlCategory && urlCategory !== 'all') {
        // When Navbar link is clicked, set only that category
        setSelectedCategories([urlCategory]);
      } else if (!urlCategory || urlCategory === 'all') {
        // When "All Products" is clicked, clear categories
        setSelectedCategories([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, sortBy]);

  const handleCategoryChange = (categoryId) => {
    let updatedCategories;

    if (categoryId === 'all') {
      updatedCategories = [];
    } else {
      // Toggle category selection - add if not present, remove if present
      updatedCategories = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
    }

    setSelectedCategories(updatedCategories);

    // Don't update URL when changing categories from sidebar
    // This allows multiple category selection without interfering with Navbar
    // URL will only change when user clicks Navbar links
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 20000]);
    setSortBy('name');
    setCurrentPage(1);

    // Clear category from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('category');
    setSearchParams(newSearchParams, { replace: true });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-dark-base py-8 pt-[120px] sm:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-4">
            All Products
          </h1>
          <p className="text-beige">
            Discover our curated collection of premium products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-dark-light border border-woody rounded-2xl shadow-lg p-6 sticky top-32">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gold mb-4">Categories</h3>
                <div className="space-y-2">
                  {/* All Products option */}
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={() => handleCategoryChange('all')}
                      className="rounded border-woody text-gold focus:outline-none focus:ring-2 focus:ring-gold bg-dark-base"
                    />
                    <span className="ml-2 text-beige">
                      All Products ({allProducts.length})
                    </span>
                  </label>

                  {/* Dynamic categories from API */}
                  {getActiveCategories().map(category => {
                    const isChecked = selectedCategories.includes(category.slug);
                    // Count products by category slug (products store category as slug)
                    const categoryProductCount = allProducts.filter(p => p.category === category.slug && p.status === 'Active').length;

                    return (
                      <label key={category._id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCategoryChange(category.slug)}
                          className="rounded border-woody text-gold focus:outline-none focus:ring-2 focus:ring-gold bg-dark-base"
                        />
                        <span className="ml-2 text-beige">
                          {category.name} ({categoryProductCount})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gold mb-4">Price Range</h3>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-woody rounded-lg appearance-none cursor-pointer focus:outline-none accent-gold"
                  />
                  <div className="flex justify-between text-sm text-beige">
                    <span>{priceRange[0]} EGP</span>
                    <span>{priceRange[1]} EGP</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full bg-woody hover:bg-woody-light text-beige py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none border border-gold/30 hover:border-gold"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Sorting and Results */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <p className="text-beige">
                Showing {filteredProducts.length} of {allProducts.length} products
                {filteredProducts.length > 0 && (
                  <span className="ml-2">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown bg-dark-base border border-gold/60 text-beige rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold appearance-none cursor-pointer"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23C9A24D' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '12px',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="name" className="bg-dark-base text-beige">Sort by Name</option>
                <option value="price-low" className="bg-dark-base text-beige">Price: Low to High</option>
                <option value="price-high" className="bg-dark-base text-beige">Price: High to Low</option>
                <option value="rating" className="bg-dark-base text-beige">Highest Rated</option>
              </select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-dark-light border border-woody rounded-lg font-semibold text-beige hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {currentPage > 3 && totalPages > 5 && (
                          <>
                            <button
                              onClick={() => goToPage(1)}
                              className="px-3 py-2 bg-dark-light border border-woody rounded-lg font-semibold text-beige hover:border-gold hover:text-gold transition-colors focus:outline-none"
                            >
                              1
                            </button>
                            {currentPage > 4 && (
                              <span className="px-2 text-woody">...</span>
                            )}
                          </>
                        )}

                        {getPageNumbers().map(pageNum => (
                          <button
                            key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 rounded-lg font-semibold transition-colors focus:outline-none ${currentPage === pageNum
                              ? 'bg-gold text-dark-base'
                              : 'bg-dark-light border border-woody text-beige hover:border-gold hover:text-gold'
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        {currentPage < totalPages - 2 && totalPages > 5 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <span className="px-2 text-woody">...</span>
                            )}
                            <button
                              onClick={() => goToPage(totalPages)}
                              className="px-3 py-2 bg-dark-light border border-woody rounded-lg font-semibold text-beige hover:border-gold hover:text-gold transition-colors focus:outline-none"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-dark-light border border-woody rounded-lg font-semibold text-beige hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
                      >
                        Next
                      </button>
                    </div>

                    {/* Page Info */}
                    <p className="text-sm text-beige">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gold mb-2">No products found</h3>
                <p className="text-beige">Try adjusting your filters to see more products.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-gold hover:bg-gold-light text-dark-base px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none border border-gold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;