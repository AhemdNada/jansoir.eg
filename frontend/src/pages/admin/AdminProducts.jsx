import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faSearch,
    faImage,
    faTimes,
    faSpinner,
    faCheck,
    faExclamationTriangle,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useProducts } from '../../context/ProductContext';
import { useCategories } from '../../context/CategoryContext';
import { productApi } from '../../api/productApi';
import { useAuth } from '../../context/AuthContext';

const AdminProducts = () => {
    const {
        products,
        loading,
        error,
        pagination,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        getProductImageUrl
    } = useProducts();

    const { getActiveCategories } = useCategories();
    const { token } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        brand: '',
        status: 'Active',
        sizes: [],    // kept for backward compatibility
        colors: [],   // kept for backward compatibility
        variants: []  // single builder list
    });
    const [variantSize, setVariantSize] = useState('');
    const [variantColor, setVariantColor] = useState('');
    const [variantQty, setVariantQty] = useState('');
    const [variantPrice, setVariantPrice] = useState('');
    const [productImages, setProductImages] = useState([]); // Array of existing product images
    const [newImageFiles, setNewImageFiles] = useState([]); // Array of new files to upload
    const [newImagePreviews, setNewImagePreviews] = useState([]); // Array of preview URLs
    const [keyFeatures, setKeyFeatures] = useState([]); // Array of key features
    const [editingFeatureIndex, setEditingFeatureIndex] = useState(null); // Index of feature being edited
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;
    const formSectionRef = useRef(null);

    // Fetch products when page or filters change
    useEffect(() => {
        fetchProducts({
            page: currentPage,
            limit: productsPerPage,
            category: filterCategory || undefined,
            search: searchQuery || undefined
        });
    }, [currentPage, filterCategory]);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts({
                page: 1,
                limit: productsPerPage,
                category: filterCategory || undefined,
                search: searchQuery || undefined
            });
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Open modal for adding new product
    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            originalPrice: '',
            category: '',
            brand: '',
            status: 'Active',
            sizes: [],
            colors: [],
            variants: []
        });
        setVariantSize('');
        setVariantColor('');
        setVariantQty('');
        setVariantPrice('');
        setProductImages([]);
        setNewImageFiles([]);
        setNewImagePreviews([]);
        setKeyFeatures([]);
        setEditingFeatureIndex(null);
        setFormErrors({});
        setSubmitMessage({ type: '', text: '' });
        setIsFormOpen(true);
        // Scroll smoothly to form section when starting to add
        setTimeout(() => {
            if (formSectionRef.current) {
                formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    };

    // Open modal for editing product
    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
            category: product.category || '',
            brand: product.brand || '',
            status: product.status,
            sizes: product.sizes || [],
            colors: product.colors || [],
            variants: product.variants || []
        });
        setVariantSize('');
        setVariantColor('');
        setVariantQty('');
        setVariantPrice('');
        // Set existing product images
        const existingImages = product.images && product.images.length > 0 
            ? product.images.map(img => getProductImageUrl(img))
            : [getProductImageUrl(product.image)];
        setProductImages(existingImages);
        setNewImageFiles([]);
        setNewImagePreviews([]);
        // Set key features
        setKeyFeatures(product.keyFeatures || []);
        setEditingFeatureIndex(null);
        setFormErrors({});
        setSubmitMessage({ type: '', text: '' });
        setIsFormOpen(true);
        // Scroll smoothly to form section when editing
        setTimeout(() => {
            if (formSectionRef.current) {
                formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle multiple image file selection
    const handleMultipleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const totalImages = productImages.length + newImageFiles.length;
        
        // Check total image count
        if (totalImages + files.length > 6) {
            setFormErrors(prev => ({ 
                ...prev, 
                images: `Maximum 6 images allowed. Currently have ${totalImages}, trying to add ${files.length}. Maximum allowed: ${6 - totalImages}` 
            }));
            return;
        }

        // Validate each file
        const validFiles = [];
        const validPreviews = [];
        
        files.forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                setFormErrors(prev => ({ 
                    ...prev, 
                    images: 'Only image files are allowed (jpeg, jpg, png, gif, webp)' 
                }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormErrors(prev => ({ 
                    ...prev, 
                    images: 'Each image must be less than 5MB' 
                }));
                return;
            }
            validFiles.push(file);
            validPreviews.push(URL.createObjectURL(file));
        });

        if (validFiles.length > 0) {
            setNewImageFiles(prev => [...prev, ...validFiles]);
            setNewImagePreviews(prev => [...prev, ...validPreviews]);
            setFormErrors(prev => ({ ...prev, images: '' }));
        }
    };

    // Handle deleting a new image preview (before upload)
    const handleDeleteNewImage = (index) => {
        setNewImageFiles(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
        setNewImagePreviews(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index]); // Clean up object URL
            updated.splice(index, 1);
            return updated;
        });
    };

    // Handle deleting an existing product image
    const handleDeleteProductImage = async (index) => {
        if (!editingProduct) return;
        
        // Prevent deleting the last image
        if (productImages.length === 1 && newImageFiles.length === 0) {
            setSubmitMessage({ 
                type: 'error', 
                text: 'Cannot delete the last image. At least one image is required.' 
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await productApi.deleteProductImage(editingProduct._id, index, token);
            
            if (response.success) {
                // Update local state
                setProductImages(prev => {
                    const updated = [...prev];
                    updated.splice(index, 1);
                    return updated;
                });
                // Refresh product data
                await fetchProducts({ page: currentPage, limit: productsPerPage });
                setSubmitMessage({ type: 'success', text: 'Image deleted successfully' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'Failed to delete image' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle adding new images to existing product
    const handleAddImagesToProduct = async () => {
        if (!editingProduct || newImageFiles.length === 0) return;

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            newImageFiles.forEach(file => {
                formData.append('images', file);
            });

            const response = await productApi.addProductImages(editingProduct._id, formData, token);
            
            if (response.success) {
                // Update local state
                const newImageUrls = response.data.images
                    .slice(productImages.length)
                    .map(img => getProductImageUrl(img));
                setProductImages(prev => [...prev, ...newImageUrls]);
                setNewImageFiles([]);
                setNewImagePreviews([]);
                // Refresh product data
                await fetchProducts({ page: currentPage, limit: productsPerPage });
                setSubmitMessage({ type: 'success', text: 'Images added successfully' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'Failed to add images' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Key Features Handlers
    const handleAddKeyFeature = () => {
        if (keyFeatures.length >= 10) {
            setSubmitMessage({ type: 'error', text: 'Maximum 10 key features allowed' });
            return;
        }
        setKeyFeatures(prev => [...prev, '']);
        setEditingFeatureIndex(keyFeatures.length);
    };

    const handleEditKeyFeature = (index, value) => {
        // Check for duplicates (case-insensitive)
        const trimmedValue = value.trim();
        if (trimmedValue) {
            const lowerFeatures = keyFeatures.map((f, i) => 
                i !== index ? f.toLowerCase() : ''
            );
            if (lowerFeatures.includes(trimmedValue.toLowerCase())) {
                setSubmitMessage({ type: 'error', text: 'Duplicate key features are not allowed' });
                return;
            }
        }
        
        // Check character limit
        if (trimmedValue.length > 150) {
            setSubmitMessage({ type: 'error', text: 'Key feature cannot exceed 150 characters' });
            return;
        }

        setKeyFeatures(prev => {
            const updated = [...prev];
            updated[index] = trimmedValue;
            return updated;
        });
    };

    const handleDeleteKeyFeature = (index) => {
        setKeyFeatures(prev => prev.filter((_, i) => i !== index));
        if (editingFeatureIndex === index) {
            setEditingFeatureIndex(null);
        } else if (editingFeatureIndex > index) {
            setEditingFeatureIndex(editingFeatureIndex - 1);
        }
    };

    const handleSaveKeyFeatures = async () => {
        if (!editingProduct) return;

        // Remove empty features
        const sanitizedFeatures = keyFeatures.filter(f => f.trim().length > 0);

        try {
            setIsSubmitting(true);
            const response = await productApi.updateKeyFeatures(editingProduct._id, sanitizedFeatures, token);
            
            if (response.success) {
                setKeyFeatures(sanitizedFeatures);
                setEditingFeatureIndex(null);
                await fetchProducts({ page: currentPage, limit: productsPerPage });
                setSubmitMessage({ type: 'success', text: 'Key features updated successfully' });
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'Failed to update key features' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Product name is required';
        }

        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
            errors.price = 'Valid price is required';
        }

        if (!formData.category) {
            errors.category = 'Category is required';
        }

        // Validate images: at least 1 image required
        const totalImages = editingProduct 
            ? productImages.length + newImageFiles.length 
            : newImageFiles.length;
        
        if (totalImages === 0) {
            errors.images = 'At least one product image is required';
        }

        // Validate key features
        const nonEmptyFeatures = keyFeatures.filter(f => f.trim().length > 0);
        if (nonEmptyFeatures.length > 10) {
            errors.keyFeatures = 'Maximum 10 key features allowed';
        }

        // Check for duplicate features
        const lowerFeatures = nonEmptyFeatures.map(f => f.toLowerCase());
        const uniqueFeatures = new Set(lowerFeatures);
        if (uniqueFeatures.size !== nonEmptyFeatures.length) {
            errors.keyFeatures = 'Duplicate key features are not allowed';
        }

        // Check character limit
        const invalidFeatures = nonEmptyFeatures.filter(f => f.length > 150);
        if (invalidFeatures.length > 0) {
            errors.keyFeatures = 'Key features cannot exceed 150 characters';
        }

        // Validate variants (price > 0, quantity >= 0)
        const invalidVariant = (formData.variants || []).find(v => {
            const qty = Number(v.quantity);
            const price = Number(v.price);
            return !Number.isFinite(qty) || qty < 0 || !Number.isFinite(price) || price <= 0;
        });
        if (invalidVariant) {
            errors.variants = 'Each variant must include price > 0 and quantity >= 0';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage({ type: '', text: '' });

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('originalPrice', formData.originalPrice || formData.price);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('status', formData.status);

            // Handle images: for new products, use first new image; for existing, keep existing images
            if (!editingProduct && newImageFiles.length > 0) {
                formDataToSend.append('image', newImageFiles[0]);
            } else if (editingProduct && newImageFiles.length > 0) {
                // For existing products, we'll add images separately after update
                formDataToSend.append('image', newImageFiles[0]);
            }

            // Add key features
            const sanitizedFeatures = keyFeatures.filter(f => f.trim().length > 0);
            formDataToSend.append('keyFeatures', JSON.stringify(sanitizedFeatures));
            // Add sizes/colors (kept for compatibility)
            formDataToSend.append('sizes', JSON.stringify(formData.sizes || []));
            formDataToSend.append('colors', JSON.stringify(formData.colors || []));
            // Add variants (single builder)
            formDataToSend.append('variants', JSON.stringify(formData.variants || []));

            let response;
            if (editingProduct) {
                response = await updateProduct(editingProduct._id, formDataToSend, token);
                
                // Add additional images if any
                if (response.success && newImageFiles.length > 1) {
                    const additionalImagesFormData = new FormData();
                    newImageFiles.slice(1).forEach(file => {
                        additionalImagesFormData.append('images', file);
                    });
                    await productApi.addProductImages(editingProduct._id, additionalImagesFormData, token);
                }
            } else {
                response = await createProduct(formDataToSend, token);
                
                // Add additional images if any
                if (response.success && newImageFiles.length > 1) {
                    const additionalImagesFormData = new FormData();
                    newImageFiles.slice(1).forEach(file => {
                        additionalImagesFormData.append('images', file);
                    });
                    await productApi.addProductImages(response.data._id, additionalImagesFormData, token);
                }
            }

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    text: editingProduct ? 'Product updated successfully!' : 'Product created successfully!'
                });
                // Scroll up to show success message clearly
                if (formSectionRef.current) {
                    formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    setIsFormOpen(false);
                    fetchProducts({ page: currentPage, limit: productsPerPage });
                    setEditingProduct(null);
                }, 1500);
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'An error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!productToDelete) return;

        setIsSubmitting(true);
        try {
            await deleteProduct(productToDelete._id, token);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        } catch (err) {
            alert(err.message || 'Failed to delete product');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close modal
    const closeModal = () => {
        if (!isSubmitting) {
            setIsFormOpen(false);
            setEditingProduct(null);
        }
    };

    // Pagination
    const goToPage = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gold">Products</h1>
                    <p className="text-beige mt-1">Manage your product inventory</p>
                </div>
                <button
                    onClick={handleAddProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-dark-base rounded-lg 
                        hover:bg-gold-dark transition-colors shadow-sm"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Product</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-woody/30 border border-woody text-woody-light px-4 py-3 rounded-lg">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {error}
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light"
                        />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light
                                focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige focus:outline-none 
                            focus:ring-2 focus:ring-gold/20 focus:border-gold"
                    >
                        <option value="">All Categories</option>
                        {getActiveCategories().map(cat => (
                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gold animate-spin" />
                </div>
            ) : (
                <>
                    {/* Products Table */}
                    <div className="bg-dark-light rounded-xl shadow-sm border border-woody overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-base border-b border-woody">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Stock</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gold uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-woody">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-beige">
                                                {searchQuery || filterCategory ? 'No products found matching your criteria' : 'No products yet. Add your first product!'}
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product._id} className="hover:bg-dark-base">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg bg-dark-base overflow-hidden flex-shrink-0">
                                                            {product.image ? (
                                                                <img
                                                                    src={getProductImageUrl(product.image)}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-woody-light">
                                                                    <FontAwesomeIcon icon={faImage} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-beige line-clamp-1">{product.name}</p>
                                                            <p className="text-xs text-woody-light">{product.brand || 'No brand'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-beige capitalize">{product.category}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gold">{product.price} EGP</span>
                                                    {product.discount > 0 && (
                                                        <span className="ml-2 text-xs text-gold bg-gold/20 border border-gold/30 px-2 py-0.5 rounded">
                                                            -{product.discount}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                    const variantStock = Array.isArray(product.variants)
                                                        ? product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0)
                                                        : 0;
                                                    const legacyStock = variantStock > 0 ? 0 : (product.stock || 0);
                                                    const totalStock = variantStock > 0 ? variantStock : legacyStock;
                                                    return (
                                                        <span className={`${totalStock > 10 ? 'text-gold' : totalStock > 0 ? 'text-beige' : 'text-woody-light'}`}>
                                                            {totalStock}
                                                        </span>
                                                    );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                                        ${product.status === 'Active' ? 'bg-gold/20 text-gold border-gold/30' : 'bg-dark-base text-beige border-woody'}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditProduct(product)}
                                                            className="p-2 text-woody-light hover:text-gold hover:bg-dark-base rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(product)}
                                                            className="p-2 text-woody-light hover:text-gold hover:bg-dark-base rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-dark-light rounded-xl shadow-sm border border-woody p-4">
                            <p className="text-sm text-beige text-center sm:text-left">
                                Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, pagination.total)} of {pagination.total} products
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => goToPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg font-medium transition-colors border
                                            ${currentPage === i + 1 ? 'bg-gold text-dark-base border-gold' : 'bg-dark-base text-beige border-woody hover:border-gold hover:text-gold'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === pagination.totalPages}
                                    className="p-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            {isFormOpen && (
                <div ref={formSectionRef} className="bg-dark-light rounded-xl shadow-sm border border-woody">
                    <div className="flex items-center justify-between p-4 border-b border-woody">
                        <h2 className="text-lg font-semibold text-gold">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <button
                            onClick={closeModal}
                            disabled={isSubmitting}
                            className="text-woody-light hover:text-gold transition-colors"
                            type="button"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-xl" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Success/Error Message */}
                            {submitMessage.text && (
                                <div className={`px-4 py-3 rounded-lg border ${submitMessage.type === 'success'
                                        ? 'bg-gold/20 border-gold/30 text-gold'
                                        : 'bg-woody/30 border-woody text-woody-light'
                                    }`}>
                                    <FontAwesomeIcon
                                        icon={submitMessage.type === 'success' ? faCheck : faExclamationTriangle}
                                        className="mr-2"
                                    />
                                    {submitMessage.text}
                                </div>
                            )}

                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">
                                    Product Name <span className="text-woody-light">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-lg border bg-dark-base text-beige placeholder-woody-light ${formErrors.name ? 'border-woody' : 'border-woody'
                                        } focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold`}
                                    placeholder="Enter product name"
                                />
                                {formErrors.name && <p className="text-woody-light text-xs mt-1">{formErrors.name}</p>}
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none"
                                    placeholder="Enter product description"
                                />
                            </div>

                            {/* Price Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-beige mb-1">
                                        Price (EGP) <span className="text-woody-light">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-2 rounded-lg border bg-dark-base text-beige placeholder-woody-light ${formErrors.price ? 'border-woody' : 'border-woody'
                                            } focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold`}
                                        placeholder="0.00"
                                    />
                                    {formErrors.price && <p className="text-woody-light text-xs mt-1">{formErrors.price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-beige mb-1">Original Price (EGP)</label>
                                    <input
                                        type="number"
                                        name="originalPrice"
                                        value={formData.originalPrice}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Category and Brand */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-beige mb-1">
                                        Category <span className="text-woody-light">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 rounded-lg border bg-dark-base text-beige ${formErrors.category ? 'border-woody' : 'border-woody'
                                            } focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold`}
                                    >
                                        <option value="">Select Category</option>
                                        {getActiveCategories().map(cat => (
                                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.category && <p className="text-woody-light text-xs mt-1">{formErrors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-beige mb-1">Brand</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                        placeholder="Enter brand"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Variant builder: single Size/Color/Quantity combination */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-beige">Variants (Size / Color / Quantity / Price)</label>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-woody-light block mb-1">Size (optional)</label>
                                        <input
                                            type="text"
                                            value={variantSize}
                                            onChange={e => setVariantSize(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="e.g. S"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-woody-light block mb-1">Color (optional)</label>
                                        <input
                                            type="text"
                                            value={variantColor}
                                            onChange={e => setVariantColor(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="e.g. Red"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
       									<label className="text-xs text-woody-light block mb-1">Quantity *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={variantQty}
                                            onChange={e => setVariantQty(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="e.g. 3"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-woody-light block mb-1">Price (EGP) *</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={variantPrice}
                                            onChange={e => setVariantPrice(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="e.g. 799"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex md:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const qtyNum = Number(variantQty);
                                                if (!Number.isFinite(qtyNum) || qtyNum < 0) {
                                                    setFormErrors(prev => ({ ...prev, variants: 'Quantity must be 0 or more' }));
                                                    return;
                                                }
                                                const priceNum = Number(variantPrice);
                                                if (!Number.isFinite(priceNum) || priceNum <= 0) {
                                                    setFormErrors(prev => ({ ...prev, variants: 'Price must be greater than 0' }));
                                                    return;
                                                }
                                                const newVariant = {
                                                    size: (variantSize || '').trim(),
                                                    color: (variantColor || '').trim(),
                                                    quantity: qtyNum,
                                                    price: priceNum
                                                };
                                                setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), newVariant] }));
                                                setVariantSize('');
                                                setVariantColor('');
                                                setVariantQty('');
                                                setVariantPrice('');
                                                setFormErrors(prev => ({ ...prev, variants: '' }));
                                            }}
                                            className="w-full md:w-auto px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark transition"
                                        >
                                            Add Variant
                                        </button>
                                    </div>
                                </div>
                                {formErrors.variants && (
                                    <p className="text-woody-light text-xs mt-1">{formErrors.variants}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {(formData.variants || []).map((v, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-dark-base border border-woody text-beige text-sm">
                                            {`${v.size || ''}${v.size && v.color ? ' / ' : ''}${v.color || ''}${(v.size || v.color) ? ' / ' : ''}${v.quantity} / ${Number(v.price || 0).toFixed(2)} EGP`}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
                                                }}
                                                className="text-woody-light hover:text-gold focus:outline-none"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Product Images Management */}
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">
                                    Product Images <span className="text-woody-light">*</span>
                                    <span className="text-xs text-woody-light ml-2">(Max 6 images, at least 1 required)</span>
                                </label>
                                
                                {/* Existing Product Images Gallery */}
                                {editingProduct && productImages.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-beige mb-2">Existing Images:</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {productImages.map((imgUrl, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={imgUrl}
                                                        alt={`Product ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border border-woody"
                                                    />
                                                    {index === 0 && (
                                                        <span className="absolute top-1 left-1 bg-gold text-dark-base text-xs px-1.5 py-0.5 rounded">
                                                            Primary
                                                        </span>
                                                    )}
                                                    {productImages.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteProductImage(index)}
                                                            disabled={isSubmitting}
                                                            className="absolute top-1 right-1 bg-dark-base text-gold rounded-full w-6 h-6 flex items-center justify-center hover:bg-gold hover:text-dark-base opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 border border-woody"
                                                            title="Delete image"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Images Preview */}
                                {newImagePreviews.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-beige mb-2">New Images to Upload:</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {newImagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={preview}
                                                        alt={`New ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border border-woody"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteNewImage(index)}
                                                        className="absolute top-1 right-1 bg-dark-base text-gold rounded-full w-6 h-6 flex items-center justify-center hover:bg-gold hover:text-dark-base opacity-0 group-hover:opacity-100 transition-opacity border border-woody"
                                                        title="Remove image"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Image Upload Input */}
                                {(!editingProduct || productImages.length + newImageFiles.length < 6) && (
                                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${formErrors.images ? 'border-woody bg-woody/10' : 'border-woody bg-dark-base hover:bg-dark-light'
                                        }`}>
                                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                            <FontAwesomeIcon icon={faImage} className="text-2xl text-woody-light mb-2" />
                                            <p className="text-sm text-beige">Click to upload images</p>
                                            <p className="text-xs text-woody-light mt-1">
                                                {productImages.length + newImageFiles.length} / 6 images
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleMultipleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}

                                {/* Add Images Button for Existing Products */}
                                {editingProduct && newImageFiles.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleAddImagesToProduct}
                                        disabled={isSubmitting}
                                        className="mt-2 w-full px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>Add {newImageFiles.length} Image{newImageFiles.length > 1 ? 's' : ''}</span>
                                    </button>
                                )}

                                {formErrors.images && <p className="text-woody-light text-xs mt-1">{formErrors.images}</p>}
                            </div>

                            {/* Key Features Section */}
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">
                                    Key Features
                                    <span className="text-xs text-woody-light ml-2">(Max 10, 150 chars each, no duplicates)</span>
                                </label>
                                
                                <div className="space-y-2">
                                    {keyFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => handleEditKeyFeature(index, e.target.value)}
                                                onBlur={() => {
                                                    if (editingProduct) {
                                                        handleSaveKeyFeatures();
                                                    }
                                                }}
                                                placeholder={`Feature ${index + 1}`}
                                                maxLength={150}
                                                className="flex-1 px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteKeyFeature(index)}
                                                className="p-2 text-woody-light hover:text-gold hover:bg-dark-base rounded-lg transition-colors"
                                                title="Delete feature"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {keyFeatures.length < 10 && (
                                        <button
                                            type="button"
                                            onClick={handleAddKeyFeature}
                                            className="w-full px-4 py-2 border-2 border-dashed border-woody rounded-lg text-beige hover:border-gold hover:text-gold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                            <span>Add Key Feature</span>
                                        </button>
                                    )}
                                </div>

                                {formErrors.keyFeatures && (
                                    <p className="text-woody-light text-xs mt-1">{formErrors.keyFeatures}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-light rounded-xl border border-woody w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-woody/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-woody">
                                <FontAwesomeIcon icon={faTrash} className="text-2xl text-woody-light" />
                            </div>
                            <h3 className="text-lg font-semibold text-gold mb-2">Delete Product</h3>
                            <p className="text-beige mb-6">
                                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setProductToDelete(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
