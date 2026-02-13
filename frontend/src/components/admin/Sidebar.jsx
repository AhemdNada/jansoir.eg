import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes,
  faTags,
  faShoppingCart,
  faHistory,
  faChartBar,
  faCog,
  faChevronLeft,
  faPalette,
  faChevronRight,
  faSignOutAlt,
  faBars,
  faTimes,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';

const MENU_GROUPS = [
  {
    title: 'CATALOG',
    items: [
      { name: 'Categories', path: '/admin/categories', icon: faTags },
      { name: 'Products', path: '/admin/products', icon: faBoxes }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Admins', path: '/admin/admins', icon: faUserShield }
    ]
  },
  {
    title: 'SALES',
    items: [
      { name: 'Cart', path: '/admin/cart', icon: faShoppingCart },
      { name: 'Orders', path: '/admin/orders', icon: faShoppingCart },
      { name: 'Customize Requests', path: '/admin/customize', icon: faPalette }
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { name: 'History', path: '/admin/history', icon: faHistory },
      { name: 'Analytics', path: '/admin/analytics', icon: faChartBar }
    ]
  },
  {
    title: null,
    items: [
      { name: 'Settings', path: '/admin/settings', icon: faCog }
    ]
  }
];

const NavItem = ({ item, isActive, isCollapsed, onNavigate }) => (
  <Link
    to={item.path}
    onClick={onNavigate}
    className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${isActive(item.path)
      ? 'bg-gold text-dark-base shadow-lg'
      : 'text-beige hover:bg-dark-light hover:text-gold'
    }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    title={isCollapsed ? item.name : ''}
  >
    <FontAwesomeIcon
      icon={item.icon}
      className={`text-lg ${isCollapsed ? '' : 'w-5'}`}
    />
    {!isCollapsed && (
      <span className="font-medium text-sm">{item.name}</span>
    )}
  </Link>
);

const SidebarContent = ({ isCollapsed, isActive, onNavigate, setIsCollapsed }) => (
  <>
    {/* Logo */}
    <div className={`p-4 border-b border-woody ${isCollapsed ? 'text-center' : ''}`}>
      <Link to="/admin" className="flex items-center gap-2" onClick={onNavigate}>
        {isCollapsed ? (
          <span className="text-2xl font-bold text-gold">J</span>
        ) : (
          <>
            <span className="text-2xl font-bold text-gold">Jansoir</span>
            <span className="text-2xl font-bold text-beige">.eg</span>
          </>
        )}
      </Link>
      {!isCollapsed && (
        <p className="text-woody-light text-xs mt-1">Admin Panel</p>
      )}
    </div>

    {/* Navigation */}
    <nav className="admin-sidebar-nav flex-1 overflow-y-auto p-4 space-y-2">
      {MENU_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4">
          {group.title && !isCollapsed && (
            <h3 className="text-woody-light text-[11px] font-semibold uppercase tracking-[0.12em] mb-2 px-4">
              {group.title}
            </h3>
          )}
          {group.title && isCollapsed && (
            <div className="border-t border-woody my-3"></div>
          )}
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Collapse Button & Logout */}
    <div className="p-4 border-t border-woody space-y-2">
      {/* Back to Store */}
      <Link
        to="/"
        className={`
            flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
            text-beige hover:bg-dark-light hover:text-gold
            ${isCollapsed ? 'justify-center' : ''}
          `}
        title={isCollapsed ? 'Back to Store' : ''}
        onClick={onNavigate}
      >
        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
        {!isCollapsed && <span className="font-medium text-sm">Back to Store</span>}
      </Link>

      {/* Collapse Toggle - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex w-full items-center justify-center gap-2 px-4 py-2 rounded-lg
            text-woody-light hover:text-gold hover:bg-dark-light transition-all duration-200"
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
        {!isCollapsed && <span className="text-sm">Collapse</span>}
      </button>
    </div>
  </>
);

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };
  const onNavigate = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-dark-light text-beige shadow-lg border border-woody hover:text-gold"
      >
        <FontAwesomeIcon icon={isMobileOpen ? faTimes : faBars} className="text-xl" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`
          admin-sidebar hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-72'}
          border-r border-woody shadow-xl shadow-black/10
        `}
        style={{ backgroundColor: '#000000' }}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          isActive={isActive}
          onNavigate={onNavigate}
          setIsCollapsed={setIsCollapsed}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`
          admin-sidebar lg:hidden fixed top-0 left-0 h-full w-72 z-50
          transform transition-transform duration-300 flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl shadow-black/20 border-r border-woody
        `}
        style={{ backgroundColor: '#000000' }}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          isActive={isActive}
          onNavigate={onNavigate}
          setIsCollapsed={setIsCollapsed}
        />
      </aside>
    </>
  );
};

export default Sidebar;
