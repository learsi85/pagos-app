import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useClienteStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/portal/estado-cuenta',   icon: '📊', label: 'Estado de cuenta' },
  { to: '/portal/financiamientos', icon: '📋', label: 'Mis financiamientos' },
];

export default function PortalLayout() {
  const { cliente, clearAuth } = useClienteStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (document.getElementById('portal-layout-responsive')) return;
    const style = document.createElement('style');
    style.id = 'portal-layout-responsive';
    style.textContent = `
      @media (max-width: 768px) {
        .portal-hamburger { display: flex !important; }
        .portal-nav { display: none !important; }
        .portal-nav.open {
          display: flex !important;
          flex-direction: column;
          position: absolute;
          top: 56px; left: 0; right: 0;
          background: #1a2035;
          padding: 8px 16px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          gap: 4px;
        }
        .portal-user-name { display: none !important; }
        .portal-topbar { padding: 0 16px !important; gap: 12px !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/portal/login');
    toast.success('Sesión cerrada');
  };

  return (
    <div style={s.shell}>
      <header className="portal-topbar" style={s.topBar}>
        <button
          className="portal-hamburger"
          style={s.hamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div style={s.brand}>
          <span style={s.brandIcon}>💳</span>
          <span style={s.brandText}>Mi portal de pagos</span>
        </div>

        <nav className={`portal-nav${menuOpen ? ' open' : ''}`} style={s.nav}>
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
          <span className="portal-user-name" style={s.userName}>{cliente?.nombre || 'Cliente'}</span>
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
  topBar:       {
    display: 'flex', alignItems: 'center', gap: 32, padding: '0 32px', height: 56,
    background: '#1a2035', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  hamburger:    {
    display: 'none', width: 40, height: 40, border: 'none', background: 'transparent',
    color: '#fff', fontSize: 20, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  brand:        { display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 },
  brandIcon:    { fontSize: 20 },
  brandText:    { color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' },
  nav:          { display: 'flex', gap: 4, flex: 1 },
  navLink:      { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' },
  navLinkActive:{ background: 'rgba(99,179,237,0.15)', color: '#63b3ed' },
  userArea:     { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 },
  userName:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, whiteSpace: 'nowrap' },
  logoutBtn:    { padding: '5px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  main:         { padding: '32px 40px' },
};
