import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/authStore';
import { authAdmin } from '@/services/api';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',        icon: '⊞', label: 'Dashboard' },
  { to: '/clientes',         icon: '👤', label: 'Clientes' },
  { to: '/productos',        icon: '📦', label: 'Productos' },
  { to: '/financiamientos',  icon: '📋', label: 'Financiamientos' },
  { to: '/empresa',          icon: '🏢', label: 'Mi empresa' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al navegar (móvil)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Inyectar media queries una sola vez
  useEffect(() => {
    if (document.getElementById('admin-layout-responsive')) return;
    const style = document.createElement('style');
    style.id = 'admin-layout-responsive';
    style.textContent = `
      @media (max-width: 768px) {
        .admin-mobile-bar { display: flex !important; }
        .admin-sidebar {
          position: fixed !important;
          top: 0; left: 0; bottom: 0;
          transform: translateX(-100%);
          box-shadow: 4px 0 24px rgba(0,0,0,0.2);
        }
        .admin-sidebar.open { transform: translateX(0); }
        .admin-sidebar-close { display: block !important; }
        
        .admin-main { padding-top: 56px; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleLogout = async () => {
    try { await authAdmin.logout(); } catch (_) {}
    clearAuth();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  return (
    <div style={styles.shell}>
      {/* Top bar móvil */}
      <header className="admin-mobile-bar" style={styles.mobileBar}>
        <button
          style={styles.hamburger}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div style={styles.mobileBrand}>
          <span style={styles.brandIcon}>💳</span>
          <span style={styles.brandText}>PagosApp</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Overlay oscuro al abrir sidebar en móvil */}
      <div
        className="admin-overlay"
        style={{ ...styles.overlay, display: sidebarOpen ? undefined : 'none' }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`} style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>💳</span>
          <span style={styles.brandText}>PagosApp</span>
          <button
            className="admin-sidebar-close"
            style={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {(user?.nombre || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.userName}>{user?.nombre || 'Admin'}</div>
              <div style={styles.userTenant}>{user?.tenant_key}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="admin-main" style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const SIDEBAR_WIDTH = 240;

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: '#f4f6f9',
  },

  mobileBar: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: 56,
    background: '#1a2035',
    padding: '0 12px',
    zIndex: 50,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  hamburger: {
    width: 40, height: 40,
    border: 'none', background: 'transparent',
    color: '#fff', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  mobileBrand: { display: 'flex', alignItems: 'center', gap: 8 },

  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 40,
  },

  closeBtn: {
    display: 'none',
    marginLeft: 'auto',
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer',
  },

  sidebar: {
    width: SIDEBAR_WIDTH,
    minHeight: '100vh',
    background: '#1a2035',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
    transition: 'transform 0.25s ease',
    zIndex: 45,
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brandIcon: { fontSize: 24 },
  brandText: { color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8,
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s',
  },
  navLinkActive: {
    background: 'rgba(99,179,237,0.15)',
    color: '#63b3ed',
  },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#3182ce', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  userName: { color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 },
  userTenant: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  logoutBtn: {
    width: '100%', padding: '8px 0',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: 'rgba(255,255,255,0.6)',
    fontSize: 13, cursor: 'pointer',
    transition: 'background 0.15s',
  },
  main: { flex: 1, overflow: 'auto', minWidth: 0 },
};
