import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faSave,
    faTrash,
    faEdit,
    faSync,
    faEnvelope,
    faKey,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';

const AdminManagement = () => {
    const { token } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ email: '', password: '' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);

    const loadAdmins = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const data = await adminApi.getAdmins(token);
            setAdmins(Array.isArray(data) ? data : []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm({ email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        const email = form.email.trim().toLowerCase();
        const password = form.password;

        if (!email) {
            setMessage({ type: 'error', text: 'Email is required' });
            return;
        }

        if (!editingId && !password) {
            setMessage({ type: 'error', text: 'Password is required for new admins' });
            return;
        }

        if (password && password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await adminApi.updateAdmin(editingId, {
                    email,
                    ...(password ? { password } : {})
                }, token);
                setMessage({ type: 'success', text: 'Admin updated successfully' });
            } else {
                await adminApi.createAdmin({ email, password }, token);
                setMessage({ type: 'success', text: 'Admin created successfully' });
            }
            resetForm();
            await loadAdmins();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (admin) => {
        setEditingId(admin._id);
        setForm({ email: admin.email, password: '' });
        setMessage({ type: '', text: '' });
    };

    const handleDelete = async (id) => {
        const toDelete = admins.find((a) => a._id === id);
        setAdminToDelete(toDelete || null);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!adminToDelete?._id) {
            setDeleteModalOpen(false);
            return;
        }
        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            await adminApi.deleteAdmin(adminToDelete._id, token);
            setMessage({ type: 'success', text: 'Admin deleted successfully' });
            await loadAdmins();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSubmitting(false);
            setDeleteModalOpen(false);
            setAdminToDelete(null);
        }
    };

    return (
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gold">Admin Management</h1>
                    <p className="text-beige mt-1">Create, update, and remove admin accounts.</p>
                </div>
                <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dark-light text-beige rounded-lg border border-woody hover:border-gold hover:text-gold transition-colors shadow-sm"
                >
                    <FontAwesomeIcon icon={faSync} />
                    <span>Reset Form</span>
                </button>
            </div>

            {/* Form Card */}
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 text-gold flex items-center justify-center border border-gold/30">
                        <FontAwesomeIcon icon={editingId ? faEdit : faPlus} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gold">
                            {editingId ? 'Edit Admin' : 'Add New Admin'}
                        </h2>
                        <p className="text-sm text-beige">
                            {editingId
                                ? 'Update email and optionally set a new password.'
                                : 'Set email and password to create an admin account.'}
                        </p>
                    </div>
                </div>

                {message.text && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            message.type === 'success'
                                ? 'bg-gold/20 text-gold border-gold/30'
                                : 'bg-woody/30 text-woody-light border-woody'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="md:col-span-1">
                        <span className="block text-sm font-medium text-beige mb-1">Email</span>
                        <div className="relative">
                            <FontAwesomeIcon
                                icon={faEnvelope}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light"
                            />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                    </label>

                    <label className="md:col-span-1">
                        <span className="block text-sm font-medium text-beige mb-1">
                            Password {editingId ? '(optional)' : ''}
                        </span>
                        <div className="relative">
                            <FontAwesomeIcon
                                icon={faKey}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-woody-light"
                            />
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-woody bg-dark-base text-beige placeholder-woody-light focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                                placeholder={editingId ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                            />
                        </div>
                    </label>

                    <div className="md:col-span-1 flex items-end gap-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-60 shadow-sm"
                        >
                            {submitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} />
                                    <span>{editingId ? 'Update Admin' : 'Create Admin'}</span>
                                </>
                            )}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-dark-base text-beige border border-woody rounded-lg hover:bg-dark-light hover:text-gold transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Admins List */}
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody">
                <div className="p-4 border-b border-woody flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gold">Admins</h3>
                        <p className="text-sm text-beige">All admin accounts in the system.</p>
                    </div>
                    <span className="text-sm text-beige bg-dark-base border border-woody px-3 py-1 rounded-full">
                        {admins.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10 text-beige">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                        Loading admins...
                    </div>
                ) : admins.length === 0 ? (
                    <div className="text-center text-beige py-10">No admins yet. Add the first one above.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-woody">
                            <thead className="bg-dark-base">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gold uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gold uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gold uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-woody">
                                {admins.map((admin) => (
                                    <tr key={admin._id} className="hover:bg-dark-base transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-beige">{admin.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-woody-light">
                                            {admin.createdAt
                                                ? new Date(admin.createdAt).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => handleEdit(admin)}
                                                className="inline-flex items-center gap-2 px-3 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin._id)}
                                                disabled={submitting}
                                                className="inline-flex items-center gap-2 px-3 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold transition-colors disabled:opacity-60"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                                <span>Delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-light rounded-xl border border-woody w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-woody/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-woody">
                                <FontAwesomeIcon icon={faTrash} className="text-2xl text-woody-light" />
                            </div>
                            <h3 className="text-lg font-semibold text-gold mb-2">Delete Admin</h3>
                            <p className="text-beige mb-6">
                                Are you sure you want to delete "{adminToDelete?.email}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (submitting) return;
                                        setDeleteModalOpen(false);
                                        setAdminToDelete(null);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 border border-woody bg-dark-base text-beige rounded-lg hover:bg-dark-light hover:text-gold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-gold text-dark-base rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
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

export default AdminManagement;


