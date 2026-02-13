import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Loader from '../common/Loader';

const AdminLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-layout flex min-h-screen" style={{ backgroundColor: '#000000' }}>
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen max-w-full" style={{ backgroundColor: '#000000' }}>
                

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6" style={{ backgroundColor: '#000000' }}>
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="bg-dark-light border-t border-woody px-6 py-4">
                    <p className="text-sm text-beige/70 text-center">
                        © {new Date().getFullYear()} Jansoir.eg Admin Panel. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
