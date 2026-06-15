import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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

  const handleLogout = async () => {
    try { await authAdmin.logout(); } catch (_) {}
    clearAuth();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>💳</span>
          <span style={styles.brandText}>PagosApp</span>
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
              <div style={styles.userTenant}>{user?.tenant}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: '#f4f6f9',
  },
  sidebar: {
    width: 240,
    minHeight: '100vh',
    background: '#1a2035',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
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
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
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
  main: { flex: 1, overflow: 'auto' },
};
