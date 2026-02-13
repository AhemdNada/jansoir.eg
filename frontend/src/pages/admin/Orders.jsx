import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faEye,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faTrash,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { orderApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import { SERVER_BASE_URL } from '../../api/apiConfig';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'cash_on_delivery'];

const getCustomerName = (user) => {
    if (!user || typeof user !== 'object') return '—';
    const first = typeof user.firstName === 'string' ? user.firstName.trim() : '';
    const last = typeof user.lastName === 'string' ? user.lastName.trim() : '';
    const fullName = `${first} ${last}`.trim();
    return fullName || user.email || '—';
};

const getCustomerEmail = (user) => {
    if (!user || typeof user !== 'object') return '—';
    return user.email || '—';
};

const formatPaymentMethod = (method) => {
    if (method === 'cash_on_delivery') return 'Cash on Delivery';
    if (method === 'vodafone_cash') return 'Vodafone Cash';
    if (method === 'instapay') return 'Instapay';
    return '—';
};

const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${SERVER_BASE_URL}${path}`;
};

const OrderRow = ({
    order,
    onSelect,
    onDeleteClick,
    isDeleting,
}) => {
    const orderId = order._id;

    return (
        <tr key={orderId} className="hover:bg-dark-base transition-colors">
            <td className="px-6 py-4 font-medium text-beige break-all">{orderId || '—'}</td>
            <td className="px-6 py-4">
                <div>
                    <p className="font-medium text-beige text-sm">{getCustomerName(order.user)}</p>
                    <p className="text-xs text-woody-light">{getCustomerEmail(order.user)}</p>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-beige">{order.items?.length || 0} items</td>
            <td className="px-6 py-4 text-sm text-beige hidden lg:table-cell whitespace-nowrap">{`${(order.shippingPrice ?? order.shippingRate ?? 0).toFixed(2)} EGP`}</td>
            <td className="px-6 py-4 font-medium text-gold whitespace-nowrap">{(order.totalWithShipping ?? order.total ?? 0).toFixed(2)} EGP</td>
            <td className="px-6 py-4 text-sm text-beige">{formatPaymentMethod(order.paymentMethod)}</td>
            <td className="px-6 py-4 text-sm text-woody-light">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onSelect(order)}
                        className="p-2 text-woody-light hover:text-gold transition-colors"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                        onClick={() => onDeleteClick(order)}
                        disabled={isDeleting}
                        className="p-2 text-woody-light hover:text-gold disabled:opacity-50"
                        title="Delete order"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const OrderCard = ({ order, onSelect, onDeleteClick, isDeleting }) => {
    const orderId = order._id;
    return (
        <div className="bg-dark-base border border-woody rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-woody-light font-semibold uppercase">Order</p>
                    <p className="text-sm text-beige break-all">{orderId || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onSelect(order)}
                        className="p-2 text-woody-light hover:text-gold transition-colors"
                        title="View"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                        onClick={() => onDeleteClick(order)}
                        disabled={isDeleting}
                        className="p-2 text-woody-light hover:text-gold disabled:opacity-50"
                        title="Delete order"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-woody-light">Customer</p>
                    <p className="text-beige">{getCustomerName(order.user)}</p>
                </div>
                <div>
                    <p className="text-xs text-woody-light">Items</p>
                    <p className="text-beige">{order.items?.length || 0}</p>
                </div>
                <div>
                    <p className="text-xs text-woody-light">Total</p>
                    <p className="text-gold font-semibold">{(order.totalWithShipping ?? order.total ?? 0).toFixed(2)} EGP</p>
                </div>
                <div>
                    <p className="text-xs text-woody-light">Payment</p>
                    <p className="text-beige">{formatPaymentMethod(order.paymentMethod)}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-woody-light">Date</p>
                    <p className="text-beige">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
                </div>
            </div>
        </div>
    );
};

const OrdersList = () => {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [selectedStatusUpdating, setSelectedStatusUpdating] = useState(false);
    const [selectedPaymentUpdating, setSelectedPaymentUpdating] = useState(false);
    const ordersPerPage = 10;

    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await orderApi.getOrders(token);
                if (!isMounted) return;
                if (res.success) {
                    setOrders(res.data || []);
                } else {
                    setError(res.message || 'Failed to load orders');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load orders');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchOrders();
        return () => { isMounted = false; };
    }, [token]);

    const replaceOrder = (updatedOrder) => {
        if (!updatedOrder?._id) return;
        setOrders(prev => prev.map(o => (o._id === updatedOrder._id ? updatedOrder : o)));
        setSelectedOrder(prev => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const res = await orderApi.updateStatus(token, orderId, newStatus);
            if (res.success && res.data) {
                replaceOrder(res.data);
                return res.data;
            }
            throw new Error(res.message || 'Failed to update order status');
        } catch (err) {
            setError(err.message || 'Failed to update order status');
            throw err;
        }
    };

    const updatePayment = async (orderId, newPaymentStatus) => {
        try {
            const res = await orderApi.updatePaymentStatus(token, orderId, newPaymentStatus);
            if (res.success && res.data) {
                replaceOrder(res.data);
                return res.data;
            }
            throw new Error(res.message || 'Failed to update payment status');
        } catch (err) {
            setError(err.message || 'Failed to update payment status');
            throw err;
        }
    };

    const filteredOrders = orders.filter(order => {
        const customerName = getCustomerName(order.user).toLowerCase();
        const orderId = (order._id || '').toLowerCase();
        const matchesSearch = customerName.includes(searchQuery.toLowerCase()) || orderId.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
    const startIndex = (currentPage - 1) * ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

    const handleDeleteClick = (order) => {
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
        setDeleteError('');
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete?._id) return;
        const orderId = orderToDelete._id;
        setDeleteLoadingId(orderId);
        try {
            const res = await orderApi.deleteOrder(token, orderId);
            if (res.success) {
                setOrders(prev => prev.filter(o => o._id !== orderId));
                setSelectedOrder(prev => (prev && prev._id === orderId ? null : prev));
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
                setDeleteError('');
            } else {
                setDeleteError(res.message || 'Failed to delete order');
            }
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete order');
        } finally {
            setDeleteLoadingId('');
        }
    };

    const handleSelectedStatusChange = async (value) => {
        if (!selectedOrder?._id) return;
        setSelectedStatusUpdating(true);
        try {
            await updateStatus(selectedOrder._id, value);
        } finally {
            setSelectedStatusUpdating(false);
        }
    };

    const handleSelectedPaymentChange = async (value) => {
        if (!selectedOrder?._id) return;
        setSelectedPaymentUpdating(true);
        try {
            await updatePayment(selectedOrder._id, value);
        } finally {
            setSelectedPaymentUpdating(false);
        }
    };

    return (
        <>
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            <div>
                <h1 className="text-2xl font-bold text-gold">Orders</h1>
                <p className="text-beige mt-1">Manage and track customer orders</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'All Orders', value: orders.length, color: 'text-gold' },
                    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: 'text-beige' },
                    { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, color: 'text-beige' },
                    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: 'text-gold' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-dark-light rounded-xl shadow-sm border border-woody p-4 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-woody-light">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light" />
                        <input
                            type="text"
                            placeholder="Search by order ID or customer..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} className="text-woody-light" />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 rounded-lg border border-woody bg-dark-base text-beige focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                        >
                            <option value="all">All Status</option>
                            {STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-dark-light rounded-xl shadow-sm border border-woody overflow-hidden">
                {error && (
                    <div className="px-4 py-3 bg-woody/30 text-woody-light border-b border-woody">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="p-6 text-center text-beige">Loading orders...</div>
                ) : (
                <>
                    {/* Mobile cards (no horizontal scroll) */}
                    <div className="md:hidden p-4 space-y-4">
                        {paginatedOrders.length === 0 ? (
                            <div className="text-center text-beige py-8">No orders found.</div>
                        ) : (
                            paginatedOrders.map((order) => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onSelect={setSelectedOrder}
                                    onDeleteClick={handleDeleteClick}
                                    isDeleting={deleteLoadingId === order._id}
                                />
                            ))
                        )}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                        <table className="w-full table-fixed">
                            <thead className="bg-dark-base">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[24%]">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[22%]">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[10%]">Products</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[12%] hidden lg:table-cell">Shipping</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[12%]">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[12%]">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[10%]">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gold uppercase w-[8%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedOrders.map((order) => (
                                    <OrderRow
                                        key={order._id}
                                        order={order}
                                        onSelect={setSelectedOrder}
                                        onDeleteClick={handleDeleteClick}
                                        isDeleting={deleteLoadingId === order._id}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
                )}

                <div className="px-6 py-4 border-t border-woody flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-beige">
                        Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
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

        {selectedOrder && (
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: '#000000' }}>
                <div className="bg-dark-light rounded-xl border border-woody w-full max-w-3xl p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gold">Order Details</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-woody-light hover:text-gold">×</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-beige">
                        <div>
                            <p className="font-semibold text-gold">Order ID:</p>
                            <p>{selectedOrder._id}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gold">Payment Method:</p>
                            <p>{formatPaymentMethod(selectedOrder.paymentMethod)}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gold">Payment Status:</p>
                            <select
                                className="mt-1 px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                value={selectedOrder.paymentStatus || 'pending'}
                                onChange={(e) => handleSelectedPaymentChange(e.target.value)}
                                disabled={selectedPaymentUpdating}
                            >
                                {PAYMENT_STATUSES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="font-semibold text-gold">Order Status:</p>
                            <select
                                className="mt-1 px-3 py-2 rounded-lg border border-woody bg-dark-base text-beige text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                value={selectedOrder.status}
                                onChange={(e) => handleSelectedStatusChange(e.target.value)}
                                disabled={selectedStatusUpdating}
                            >
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="font-semibold text-gold">Customer:</p>
                            <p>{getCustomerName(selectedOrder.user)}</p>
                            <p className="text-xs text-woody-light">{getCustomerEmail(selectedOrder.user)}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gold">Phone:</p>
                            <p>{selectedOrder.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="font-semibold text-gold">Address:</p>
                            <p>{selectedOrder.address}</p>
                        </div>
                    </div>
                    {selectedOrder.paymentReceipt && (
                        <div>
                            <p className="font-semibold mb-2 text-gold">Payment Receipt:</p>
                            <a
                                href={getFileUrl(selectedOrder.paymentReceipt)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gold hover:text-gold-light hover:underline text-sm"
                            >
                                View receipt
                            </a>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold mb-2 text-gold">Items</p>
                        <div className="space-y-2">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-beige">
                                    <div className="flex flex-col">
                                        <span>{item.name} × {item.quantity}</span>
                                        {(item.size || item.color) && (
                                            <span className="text-xs text-woody-light">
                                                {item.size ? `Size: ${item.size}` : ''} {item.color ? `Color: ${item.color}` : ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gold">{(item.price * item.quantity).toFixed(2)} EGP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-beige">
                        <div>Subtotal: <span className="text-gold">{(selectedOrder.subtotal ?? 0).toFixed(2)} EGP</span></div>
                        <div>
                            Shipping: <span className="text-gold">{(selectedOrder.shippingPrice ?? selectedOrder.shippingRate ?? 0).toFixed(2)} EGP</span>
                        </div>
                        <div>
                            Governorate: <span className="text-gold">{selectedOrder.shippingGovernorate?.name || '—'}</span>
                        </div>
                        <div>
                            Discount: <span className="text-gold">-{(selectedOrder.discountAmount ?? 0).toFixed(2)} EGP</span>
                        </div>
                        <div className="font-semibold text-gold">
                            Total: {(selectedOrder.totalWithShipping ?? selectedOrder.total ?? 0).toFixed(2)} EGP
                        </div>
                        <div>
                            Coupon: <span className="text-gold">{selectedOrder.coupon?.code || '—'}</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteClick(selectedOrder)}
                                disabled={deleteLoadingId === selectedOrder._id}
                                className="px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                            >
                                Delete Order
                            </button>
                            <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-dark-light rounded-xl border border-woody w-full max-w-sm p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-woody/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-woody">
                            <FontAwesomeIcon icon={faTrash} className="text-2xl text-woody-light" />
                        </div>
                        <h3 className="text-lg font-semibold text-gold mb-2">Delete Order</h3>
                        <p className="text-beige mb-4">
                            This action will permanently delete this order. Are you sure?
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
                                    setOrderToDelete(null);
                                    setDeleteError('');
                                }}
                                disabled={!!deleteLoadingId}
                                className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteOrder}
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
        </>
    );
};

const Orders = () => <OrdersList />;

export default Orders;
