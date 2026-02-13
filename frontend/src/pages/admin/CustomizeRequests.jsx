import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faTrash,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faSpinner,
    faImage,
    faEye
} from '@fortawesome/free-solid-svg-icons';
import { customizeApi } from '../../api/customizeApi';
import { useAuth } from '../../context/AuthContext';
import { SERVER_BASE_URL } from '../../api/apiConfig';

const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${SERVER_BASE_URL}${path}`;
};

const CustomizeRow = ({
    customize,
    onDeleteClick,
    isDeleting,
    onImageClick,
    onViewDetails
}) => {
    const customizeId = customize._id;

    return (
        <tr key={customizeId} className="hover:bg-dark-base transition-colors">
            <td className="px-6 py-4 text-sm text-beige">{customize.email || '—'}</td>
            <td className="px-6 py-4 text-sm text-beige">{customize.phoneNumber || '—'}</td>
            <td className="px-6 py-4 text-sm text-beige max-w-xs truncate">
                {customize.description || '—'}
            </td>
            <td className="px-6 py-4 text-sm text-beige">{customize.size || '—'}</td>
            <td className="px-6 py-4">
                {customize.photo ? (
                    <div 
                        className="w-16 h-16 rounded-lg bg-dark-base overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onImageClick(customize.photo)}
                    >
                        <img
                            src={getFileUrl(customize.photo)}
                            alt="Customize preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-lg bg-dark-base flex items-center justify-center text-woody-light">
                        <FontAwesomeIcon icon={faImage} />
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-woody-light">
                {customize.createdAt ? new Date(customize.createdAt).toLocaleDateString() : '—'}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onViewDetails(customize)}
                        className="p-2 text-woody-light hover:text-gold transition-colors"
                        title="View full details"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                        onClick={() => onDeleteClick(customize)}
                        disabled={isDeleting}
                        className="p-2 text-woody-light hover:text-gold disabled:opacity-50 transition-colors"
                        title="Delete customize request"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const CustomizeRequestsList = () => {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [customizeRequests, setCustomizeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customizeToDelete, setCustomizeToDelete] = useState(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedCustomize, setSelectedCustomize] = useState(null);
    const requestsPerPage = 10;

    useEffect(() => {
        let isMounted = true;
        const fetchCustomizeRequests = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await customizeApi.getAllCustomizeRequests(token);
                if (!isMounted) return;
                if (res.success) {
                    setCustomizeRequests(res.data.customizeRequests || []);
                } else {
                    setError(res.message || 'Failed to load customize requests');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load customize requests');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCustomizeRequests();
        return () => { isMounted = false; };
    }, [token]);

    const filteredRequests = customizeRequests.filter(request => {
        const email = (request.email || '').toLowerCase();
        const phone = (request.phoneNumber || '').toLowerCase();
        const description = (request.description || '').toLowerCase();
        const matchesSearch = email.includes(searchQuery.toLowerCase()) || 
                             phone.includes(searchQuery.toLowerCase()) ||
                             description.includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage) || 1;
    const startIndex = (currentPage - 1) * requestsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + requestsPerPage);

    const handleDeleteClick = (customize) => {
        setCustomizeToDelete(customize);
        setIsDeleteModalOpen(true);
        setDeleteError('');
    };

    const handleDeleteRequest = async () => {
        if (!customizeToDelete?._id) return;
        const customizeId = customizeToDelete._id;
        setDeleteLoadingId(customizeId);
        try {
            const res = await customizeApi.deleteCustomizeRequest(customizeId, token);
            if (res.success) {
                setCustomizeRequests(prev => prev.filter(r => r._id !== customizeId));
                setIsDeleteModalOpen(false);
                setCustomizeToDelete(null);
                setDeleteError('');
            } else {
                setDeleteError(res.message || 'Failed to delete customize request');
            }
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete customize request');
        } finally {
            setDeleteLoadingId('');
        }
    };

    return (
        <>
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            <div>
                <h1 className="text-2xl font-bold text-gold">Customize Requests</h1>
                <p className="text-beige mt-1">Manage and track customer customization requests</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'All Requests', value: customizeRequests.length, color: 'text-gold' },
                    { label: 'Pending', value: customizeRequests.filter(r => r.status === 'pending').length, color: 'text-beige' },
                    { label: 'Reviewing', value: customizeRequests.filter(r => r.status === 'reviewing').length, color: 'text-beige' },
                    { label: 'Completed', value: customizeRequests.filter(r => r.status === 'completed').length, color: 'text-gold' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-dark-light rounded-xl shadow-sm border border-woody p-4 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-woody-light">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-4">
                <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light" />
                    <input
                        type="text"
                        placeholder="Search by email, phone, or description..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                    />
                </div>
            </div>

            <div className="bg-dark-light rounded-xl shadow-sm border border-woody overflow-hidden">
                {error && (
                    <div className="px-4 py-3 bg-woody/30 text-woody-light border-b border-woody">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="p-6 text-center text-beige">Loading customize requests...</div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-base">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Phone Number</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Created Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-beige">
                                        {searchQuery ? 'No customize requests found matching your criteria' : 'No customize requests yet.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRequests.map((request) => (
                                    <CustomizeRow
                                        key={request._id}
                                        customize={request}
                                        onDeleteClick={handleDeleteClick}
                                        isDeleting={deleteLoadingId === request._id}
                                        onImageClick={(photo) => setSelectedImage(photo)}
                                        onViewDetails={(customize) => setSelectedCustomize(customize)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                <div className="px-6 py-4 border-t border-woody flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-beige">
                        Showing {filteredRequests.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + requestsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span className="px-4 py-2 text-sm text-beige">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-dark-light rounded-xl border border-woody w-full max-w-sm p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-woody/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-woody">
                            <FontAwesomeIcon icon={faTrash} className="text-2xl text-woody-light" />
                        </div>
                        <h3 className="text-lg font-semibold text-gold mb-2">Delete Customize Request</h3>
                        <p className="text-beige mb-4">
                            This action will permanently delete this customize request and its associated image. Are you sure?
                        </p>
                        {deleteError && (
                            <div className="mb-4 px-3 py-2 rounded-lg bg-woody/30 text-woody-light border border-woody text-sm">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (deleteLoadingId) return;
                                    setIsDeleteModalOpen(false);
                                    setCustomizeToDelete(null);
                                    setDeleteError('');
                                }}
                                disabled={!!deleteLoadingId}
                                className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRequest}
                                disabled={!!deleteLoadingId}
                                className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoadingId ? (
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

        {selectedImage && (
            <div 
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedImage(null)}
            >
                <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gold transition-colors bg-black/50 rounded-full p-2 z-10 focus:outline-none"
                        aria-label="Close"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-2xl" />
                    </button>
                    <img
                        src={getFileUrl(selectedImage)}
                        alt="Customize preview full size"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        )}

        {selectedCustomize && (
            <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedCustomize(null)}
            >
                <div 
                    className="bg-dark-light rounded-xl border border-woody w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 bg-dark-light border-b border-woody px-6 py-4 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gold">Customize Request Details</h3>
                        <button
                            onClick={() => setSelectedCustomize(null)}
                            className="p-2 text-woody-light hover:text-gold transition-colors focus:outline-none"
                            aria-label="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-xl" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Image */}
                        {selectedCustomize.photo && (
                            <div className="flex justify-center">
                                <div 
                                    className="w-full max-w-md rounded-lg bg-dark-base overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                        setSelectedCustomize(null);
                                        setSelectedImage(selectedCustomize.photo);
                                    }}
                                >
                                    <img
                                        src={getFileUrl(selectedCustomize.photo)}
                                        alt="Customize preview"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Email</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-2 border border-woody">
                                {selectedCustomize.email || '—'}
                            </p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Phone Number</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-2 border border-woody">
                                {selectedCustomize.phoneNumber || '—'}
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Description</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-3 border border-woody whitespace-pre-wrap break-words">
                                {selectedCustomize.description || '—'}
                            </p>
                        </div>

                        {/* Size */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Size</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-2 border border-woody">
                                {selectedCustomize.size || '—'}
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Status</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-2 border border-woody capitalize">
                                {selectedCustomize.status || '—'}
                            </p>
                        </div>

                        {/* Created Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gold mb-2">Created Date</label>
                            <p className="text-beige bg-black rounded-lg px-4 py-2 border border-woody">
                                {selectedCustomize.createdAt 
                                    ? new Date(selectedCustomize.createdAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const CustomizeRequests = () => <CustomizeRequestsList />;

export default CustomizeRequests;

