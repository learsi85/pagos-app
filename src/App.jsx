import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAdminStore, useClienteStore, useCan } from '@/store/authStore';

import AdminLayout       from '@/components/layout/AdminLayout';
import PortalLayout      from '@/components/layout/PortalLayout';

import LoginAdmin            from '@/pages/admin/LoginAdmin';
import SolicitarResetAdmin   from '@/pages/admin/SolicitarResetAdmin';
import ResetPasswordAdmin    from '@/pages/admin/ResetPasswordAdmin';
import Dashboard             from '@/pages/admin/Dashboard';
import Clientes              from '@/pages/admin/Clientes';
import ClienteDetalle        from '@/pages/admin/ClienteDetalle';
import Productos             from '@/pages/admin/Productos';
import Financiamientos       from '@/pages/admin/Financiamientos';
import FinanciamientoNuevo   from '@/pages/admin/FinanciamientoNuevo';
import FinanciamientoDetalle from '@/pages/admin/FinanciamientoDetalle';
import RegistrarPago         from '@/pages/admin/RegistrarPago';
import Empresa               from '@/pages/admin/Empresa';
import SolicitudesPago from '@/pages/admin/SolicitudesPago';

import LoginCliente        from '@/pages/cliente/LoginCliente';
import PrimerAcceso        from '@/pages/cliente/PrimerAcceso';
import CambiarPassword     from '@/pages/cliente/CambiarPassword';
import OlvidePassword      from '@/pages/cliente/OlvidePassword';
import ResetPassword       from '@/pages/cliente/ResetPassword';
import EstadoCuenta        from '@/pages/cliente/EstadoCuenta';
import MisFinanciamientos  from '@/pages/cliente/MisFinanciamientos';
import DetalleFinanciamiento from '@/pages/cliente/DetalleFinanciamiento';

function RequireAdmin({ children }) {
  const { token, user } = useAdminStore();
  // Sesiones anteriores al sistema de permisos vuelven a pasar por login
  if (!token || !Array.isArray(user?.permisos)) return <Navigate to="/login" replace />;
  return children;
}

function RequirePermiso({ permiso, children }) {
  const can = useCan();
  return can(permiso)
    ? children
    : <p style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No tienes permiso para ver esta pantalla</p>;
}

function RequireCliente({ children }) {
  const { token, mustChange } = useClienteStore();
  if (!token) return <Navigate to="/portal/login" replace />;
  if (mustChange) return <Navigate to="/portal/cambiar-password" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        {/* Admin */}
        <Route path="/login" element={<LoginAdmin />} />
        <Route path="/solicitar-reset" element={<SolicitarResetAdmin />} />
        <Route path="/reset-password" element={<ResetPasswordAdmin />} />
        <Route path="/" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"                element={<RequirePermiso permiso="dashboard.ver"><Dashboard /></RequirePermiso>} />
          <Route path="clientes"                 element={<RequirePermiso permiso="clientes.ver"><Clientes /></RequirePermiso>} />
          <Route path="clientes/:id"             element={<RequirePermiso permiso="clientes.ver"><ClienteDetalle /></RequirePermiso>} />
          <Route path="productos"                element={<RequirePermiso permiso="productos.ver"><Productos /></RequirePermiso>} />
          <Route path="financiamientos"          element={<RequirePermiso permiso="financiamientos.ver"><Financiamientos /></RequirePermiso>} />
          <Route path="financiamientos/nuevo"    element={<RequirePermiso permiso="financiamientos.crear"><FinanciamientoNuevo /></RequirePermiso>} />
          <Route path="financiamientos/:id"      element={<RequirePermiso permiso="financiamientos.ver"><FinanciamientoDetalle /></RequirePermiso>} />
          <Route path="financiamientos/:id/pago" element={<RequirePermiso permiso="pagos.registrar"><RegistrarPago /></RequirePermiso>} />
          <Route path="empresa"                  element={<RequirePermiso permiso="empresa.editar"><Empresa /></RequirePermiso>} />
          <Route path="solicitudes-pago"         element={<RequirePermiso permiso="solicitudes_pago.ver"><SolicitudesPago /></RequirePermiso>} />
        </Route>

        {/* Portal cliente — rutas públicas */}
        <Route path="/portal/login"           element={<LoginCliente />} />
        <Route path="/portal/acceso"          element={<PrimerAcceso />} />
        <Route path="/portal/olvide-password" element={<OlvidePassword />} />
        <Route path="/portal/reset-password"  element={<ResetPassword />} />
        <Route path="/portal/cambiar-password" element={<CambiarPassword />} />

        {/* Portal cliente — rutas protegidas */}
        <Route path="/portal" element={<RequireCliente><PortalLayout /></RequireCliente>}>
          <Route index element={<Navigate to="/portal/estado-cuenta" replace />} />
          <Route path="estado-cuenta"       element={<EstadoCuenta />} />
          <Route path="financiamientos"     element={<MisFinanciamientos />} />
          <Route path="financiamientos/:id" element={<DetalleFinanciamiento />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
