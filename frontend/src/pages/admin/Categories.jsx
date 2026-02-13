import React, { useState, useRef } from 'react';
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
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../context/CategoryContext';
import { useAuth } from '../../context/AuthContext';

const Categories = () => {
    const {
        categories,
        loading,
        error,
        createCategory,
        updateCategory,
        deleteCategory,
        getImageUrl
    } = useCategories();

    const { token } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Active'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const formSectionRef = useRef(null);

    // Filter categories based on search
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open modal for adding new category
    const handleAddCategory = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', status: 'Active' });
        setImageFile(null);
        setImagePreview(null);
        setFormErrors({});
        setSubmitMessage({ type: '', text: '' });
        setIsModalOpen(true);
        // Scroll to form section when starting to add
        setTimeout(() => {
            if (formSectionRef.current) {
                formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    };

    // Open modal for editing category
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            status: category.status
        });
        setImageFile(null);
        setImagePreview(getImageUrl(category.image));
        setFormErrors({});
        setSubmitMessage({ type: '', text: '' });
        setIsModalOpen(true);
        // Scroll to form section when editing
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
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setFormErrors(prev => ({ ...prev, image: 'Only image files are allowed (jpeg, jpg, png, gif, webp)' }));
                return;
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setFormErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setFormErrors(prev => ({ ...prev, image: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Category name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Category name must be at least 2 characters';
        } else if (formData.name.trim().length > 50) {
            errors.name = 'Category name cannot exceed 50 characters';
        }

        if (formData.description && formData.description.length > 500) {
            errors.description = 'Description cannot exceed 500 characters';
        }

        // Image is required for new categories
        if (!editingCategory && !imageFile) {
            errors.image = 'Category image is required';
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
            formDataToSend.append('status', formData.status);

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            let response;
            if (editingCategory) {
                response = await updateCategory(editingCategory._id, formDataToSend, token);
            } else {
                response = await createCategory(formDataToSend, token);
            }

            if (response.success) {
                setSubmitMessage({
                    type: 'success',
                    text: editingCategory ? 'Category updated successfully!' : 'Category created successfully!'
                });
                // Scroll up to show success message clearly
                if (formSectionRef.current) {
                    formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTimeout(() => {
                    setIsModalOpen(false);
                }, 1500);
            }
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'An error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setIsDeleteModalOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsSubmitting(true);
        try {
            await deleteCategory(categoryToDelete._id, token);
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
        } catch (err) {
            alert(err.message || 'Failed to delete category');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close modal
    const closeModal = () => {
        if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingCategory(null);
        }
    };

    return (
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gold">Categories</h1>
                    <p className="text-beige mt-1">Manage your product categories</p>
                </div>
                <button
                    onClick={handleAddCategory}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-dark-base rounded-lg 
                        hover:bg-gold-dark transition-colors shadow-sm"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Category</span>
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
                <div className="relative max-w-md">
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light"
                    />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light
                            focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold
                            transition-all duration-200"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gold animate-spin" />
                </div>
            ) : (
                /* Categories Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-beige">
                            {searchQuery ? 'No categories found matching your search' : 'No categories yet. Add your first category!'}
                        </div>
                    ) : (
                        filteredCategories.map((category) => (
                            <div key={category._id} className="bg-dark-light rounded-xl shadow-sm border border-woody overflow-hidden hover:border-gold transition-colors">
                                <div className="h-40 bg-dark-base relative">
                                    {category.image ? (
                                        <img
                                            src={getImageUrl(category.image)}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-woody-light">
                                            <FontAwesomeIcon icon={faImage} className="text-4xl" />
                                        </div>
                                    )}
                                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border
                                        ${category.status === 'Active' ? 'bg-gold/20 text-gold border-gold/30' : 'bg-dark-base text-beige border-woody'}`}>
                                        {category.status}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-beige">{category.name}</h3>
                                    <p className="text-sm text-woody-light mt-1">{category.productsCount || 0} products</p>
                                    {category.description && (
                                        <p className="text-xs text-woody-light mt-2 line-clamp-2">{category.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => handleEditCategory(category)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 
                                                border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors text-sm"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(category)}
                                            className="inline-flex items-center justify-center px-3 py-2 
                                                border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add/Edit Section (inline, similar to Products) */}
            {isModalOpen && (
                <div ref={formSectionRef} className="bg-dark-light rounded-xl shadow-sm border border-woody">
                    <div className="flex items-center justify-between p-4 border-b border-woody">
                        <h2 className="text-lg font-semibold text-gold">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h2>
                        <button
                            onClick={closeModal}
                            disabled={isSubmitting}
                            className="text-woody-light hover:text-gold transition-colors"
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
                                Category Name <span className="text-woody-light">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-lg border bg-dark-base text-beige placeholder-woody-light ${formErrors.name ? 'border-woody' : 'border-woody'
                                    } focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all`}
                                placeholder="Enter category name"
                            />
                            {formErrors.name && (
                                <p className="text-woody-light text-xs mt-1">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-beige mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-2 rounded-lg border bg-dark-base text-beige placeholder-woody-light ${formErrors.description ? 'border-woody' : 'border-woody'
                                    } focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all resize-none`}
                                placeholder="Enter category description (optional)"
                            />
                            {formErrors.description && (
                                <p className="text-woody-light text-xs mt-1">{formErrors.description}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-beige mb-1">
                                Category Image {!editingCategory && <span className="text-woody-light">*</span>}
                            </label>
                            <div className="mt-1">
                                {imagePreview ? (
                                    <div className="relative w-full h-40 bg-dark-base rounded-lg overflow-hidden border border-woody">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(editingCategory ? getImageUrl(editingCategory.image) : null);
                                            }}
                                            className="absolute top-2 right-2 bg-dark-base text-gold rounded-full w-6 h-6 flex items-center justify-center hover:bg-gold hover:text-dark-base transition-colors border border-woody"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formErrors.image ? 'border-woody bg-woody/10' : 'border-woody bg-dark-base hover:bg-dark-light'
                                        }`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FontAwesomeIcon icon={faImage} className="text-3xl text-woody-light mb-2" />
                                            <p className="text-sm text-beige">Click to upload image</p>
                                            <p className="text-xs text-woody-light mt-1">PNG, JPG, GIF, WEBP (max 5MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {formErrors.image && (
                                    <p className="text-woody-light text-xs mt-1">{formErrors.image}</p>
                                )}
                            </div>
                        </div>

                        {/* Status Field */}
                        <div>
                            <label className="block text-sm font-medium text-beige mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
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
                            <h3 className="text-lg font-semibold text-gold mb-2">Delete Category</h3>
                            <p className="text-beige mb-6">
                                Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setCategoryToDelete(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

export default Categories;
