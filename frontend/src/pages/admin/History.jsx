import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faShoppingCart,
    faUser,
    faBoxes,
    faCog,
    faTrash,
    faEdit,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { historyApi } from '../../api/historyApi';
import { useAuth } from '../../context/AuthContext';

const History = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [hasFetched, setHasFetched] = useState(false);
    const [searchDebounced, setSearchDebounced] = useState('');
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [clearError, setClearError] = useState('');
    const navigate = useNavigate();
    const { token } = useAuth();

    const types = ['all', 'order', 'product', 'customer', 'settings', 'payment', 'system'];
    const limit = 20;

    useEffect(() => {
        const id = setTimeout(() => setSearchDebounced(searchQuery.trim()), 300);
        return () => clearTimeout(id);
    }, [searchQuery]);

    const fetchHistory = useCallback(async (opts = {}) => {
        if (!token) {
            setLoading(false);
            return;
        }
        const targetPage = opts.page || 1;
        const append = opts.append || false;

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setError('');
        }

        try {
            const response = await historyApi.getHistory(token, {
                page: targetPage,
                limit,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                search: searchDebounced || undefined
            });

            setHasFetched(true);
            setPage(response.page);
            setTotalPages(response.totalPages || 1);
            const list = Array.isArray(response.data) ? response.data : [];
            setActivities(prev => append ? [...prev, ...list] : list);
        } catch (err) {
            setError(err.message || 'Failed to load activity history');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [token, typeFilter, searchDebounced]);

    useEffect(() => {
        setPage(1);
        fetchHistory({ page: 1, append: false });
    }, [typeFilter, searchDebounced, fetchHistory]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'order': return faShoppingCart;
            case 'product': return faBoxes;
            case 'customer': return faUser;
            case 'settings': return faCog;
            case 'payment': return faCog;
            default: return faCog;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-woody/40 text-gold border border-gold/30';
            case 'warning': return 'bg-woody/30 text-beige border border-woody';
            default: return 'bg-dark-base text-beige border border-woody';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'order': return 'bg-gold/20 text-gold border border-gold/30';
            case 'product': return 'bg-gold/15 text-beige border border-woody';
            case 'customer': return 'bg-gold/20 text-gold border border-gold/30';
            case 'settings': return 'bg-woody/30 text-beige border border-woody';
            case 'payment': return 'bg-gold/15 text-beige border border-woody';
            case 'system': return 'bg-dark-base text-beige border border-woody';
            default: return 'bg-dark-base text-beige border border-woody';
        }
    };

    const getActionIcon = (action) => {
        if (action.includes('deleted') || action.includes('cancelled')) return faTrash;
        if (action.includes('updated') || action.includes('shipped')) return faEdit;
        return null;
    };

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const diffMs = Date.now() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    };

    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / oneDayMs);
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const groupedActivities = useMemo(() => {
        const groups = {};
        activities.forEach((activity) => {
            const dateKey = new Date(activity.createdAt).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(activity);
        });

        return Object.entries(groups)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([dateKey, items]) => ({
                dateKey,
                label: formatDateLabel(dateKey),
                items
            }));
    }, [activities]);

    const getEntityLink = (activity) => {
        const { entityType } = activity;
        switch (entityType) {
            case 'order':
                return '/admin/orders';
            case 'product':
                return '/admin/products';
            case 'category':
                return '/admin/categories';
            case 'settings':
            case 'payment':
                return '/admin/settings';
            case 'admin':
                return '/admin/admins';
            default:
                return null;
        }
    };

    const handleNavigate = (activity) => {
        const link = getEntityLink(activity);
        if (link) {
            navigate(link);
        }
    };

    const handleClearAll = async () => {
        if (isClearing) return;
        setIsClearing(true);
        setClearError('');
        
        try {
            await historyApi.clearAllHistory(token);
            setActivities([]);
            setPage(1);
            setTotalPages(1);
            setHasFetched(true);
            setIsClearModalOpen(false);
            setError('');
        } catch (err) {
            setClearError(err.message || 'Failed to clear history');
        } finally {
            setIsClearing(false);
        }
    };

    const isFilterEmptyState = hasFetched && activities.length === 0 && !loading && !error && searchDebounced;
    const isNoData = hasFetched && activities.length === 0 && !searchDebounced && !loading;

    return (
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gold">Activity History</h1>
                    <p className="text-beige mt-1">Track all activities and changes in your store</p>
                </div>
                {activities.length > 0 && (
                    <button
                        onClick={() => setIsClearModalOpen(true)}
                        className="px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Clear All</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light 
                focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} className="text-woody-light" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige focus:outline-none 
                focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all capitalize"
                        >
                            {types.map(type => (
                                <option key={type} value={type} className="capitalize">
                                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-6">
                {error && (
                    <div className="mb-4 rounded-lg bg-woody/30 text-woody-light border border-woody px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {loading && !loadingMore && (
                    <div className="py-8 text-center text-beige">Loading activity history...</div>
                )}

                {!loading && !error && groupedActivities.length > 0 && (
                    <div className="space-y-8">
                        {groupedActivities.map((group) => (
                            <div key={group.dateKey} className="space-y-4">
                                <div className="text-sm font-semibold text-gold uppercase">{group.label}</div>
                                <div className="space-y-6">
                                    {group.items.map((activity) => {
                                        const actionIcon = getActionIcon(activity.action || '');
                                        const link = getEntityLink(activity);
                                        return (
                                            <div
                                                key={activity._id}
                                                className={`flex gap-4 ${link ? 'cursor-pointer hover:bg-dark-base rounded-lg px-3 -mx-3 py-3 transition' : ''}`}
                                                onClick={() => handleNavigate(activity)}
                                                title={link ? 'View related item' : 'Item no longer exists'}
                                            >
                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getSeverityColor(activity.severity)}`}>
                                                    <FontAwesomeIcon icon={getTypeIcon(activity.type)} className="text-sm" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 pb-6 border-b border-woody last:border-0 last:pb-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium text-beige flex items-center gap-2">
                                                                {actionIcon && (
                                                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${getTypeColor(activity.type)}`}>
                                                                        <FontAwesomeIcon icon={actionIcon} className="text-[10px]" />
                                                                    </span>
                                                                )}
                                                                <span>{activity.action}</span>
                                                            </p>
                                                            {activity.details && (
                                                                <p className="text-sm text-woody-light mt-1">{activity.details}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-woody-light whitespace-nowrap" title={new Date(activity.createdAt).toLocaleString()}>
                                                            {formatRelativeTime(activity.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                        <span className={`px-2 py-0.5 rounded font-medium capitalize border ${getTypeColor(activity.type)}`}>
                                                            {activity.type}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded font-medium capitalize border ${getSeverityColor(activity.severity)}`}>
                                                            {activity.severity || 'info'}
                                                        </span>
                                                        <span className="text-woody-light">
                                                            by {activity?.performedBy?.name || activity?.performedBy?.email || 'System'}
                                                        </span>
                                                        <span className="text-woody-light">•</span>
                                                        <span className="text-woody-light">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isNoData && (
                    <div className="text-center py-12">
                        <p className="text-beige">No activity history recorded yet.</p>
                    </div>
                )}

                {isFilterEmptyState && (
                    <div className="text-center py-12">
                        <p className="text-beige">No activities match the current filters.</p>
                    </div>
                )}

                {!loading && !error && groupedActivities.length > 0 && page < totalPages && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => fetchHistory({ page: page + 1, append: true })}
                            disabled={loadingMore}
                            className="px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige hover:bg-dark-light hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>

            {/* Clear All Modal */}
            {isClearModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-light rounded-xl border border-woody w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-woody/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-woody">
                                <FontAwesomeIcon icon={faTrash} className="text-2xl text-woody-light" />
                            </div>
                            <h3 className="text-lg font-semibold text-gold mb-2">Clear All History</h3>
                            <p className="text-beige mb-4">
                                This action will permanently delete all activity history from the database. This cannot be undone. Are you sure?
                            </p>
                            {clearError && (
                                <div className="mb-4 px-3 py-2 rounded-lg bg-woody/30 text-woody-light border border-woody text-sm">
                                    {clearError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (isClearing) return;
                                        setIsClearModalOpen(false);
                                        setClearError('');
                                    }}
                                    disabled={!!isClearing}
                                    className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={!!isClearing}
                                    className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isClearing ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            <span>Clearing...</span>
                                        </>
                                    ) : (
                                        <span>Clear All</span>
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

export default History;
