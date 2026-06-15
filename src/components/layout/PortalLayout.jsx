import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useClienteStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/portal/estado-cuenta',   icon: '📊', label: 'Estado de cuenta' },
  { to: '/portal/financiamientos', icon: '📋', label: 'Mis financiamientos' },
];

export default function PortalLayout() {
  const { cliente, clearAuth } = useClienteStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/portal/login');
    toast.success('Sesión cerrada');
  };

  return (
    <div style={s.shell}>
      {/* Top bar */}
      <header style={s.topBar}>
        <div style={s.brand}>
          <span style={s.brandIcon}>💳</span>
          <span style={s.brandText}>Mi portal de pagos</span>
        </div>
        <nav style={s.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...s.navLink,
                ...(isActive ? s.navLinkActive : {}),
              })}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={s.userArea}>
          <span style={s.userName}>{cliente?.nombre || 'Cliente'}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Salir</button>
        </div>
      </header>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell:        { minHeight: '100vh', background: '#f4f6f9', fontFamily: "'Inter','Segoe UI',sans-serif" },
  topBar:       { display: 'flex', alignItems: 'center', gap: 32, padding: '0 32px', height: 60, background: '#1a2035', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 },
  brand:        { display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 },
  brandIcon:    { fontSize: 20 },
  brandText:    { color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' },
  nav:          { display: 'flex', gap: 4, flex: 1 },
  navLink:      { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' },
  navLinkActive:{ background: 'rgba(99,179,237,0.15)', color: '#63b3ed' },
  userArea:     { display: 'flex', alignItems: 'center', gap: 12 },
  userName:     { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  logoutBtn:    { padding: '5px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' },
  main:         { padding: '32px 40px' },
};
