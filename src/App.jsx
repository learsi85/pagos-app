import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAdminStore, useClienteStore } from '@/store/authStore';

// Layout
import AdminLayout  from '@/components/layout/AdminLayout';
import PortalLayout from '@/components/layout/PortalLayout';

// Páginas admin
import LoginAdmin           from '@/pages/admin/LoginAdmin';
import Dashboard            from '@/pages/admin/Dashboard';
import Clientes             from '@/pages/admin/Clientes';
import ClienteDetalle       from '@/pages/admin/ClienteDetalle';
import Productos            from '@/pages/admin/Productos';
import Financiamientos      from '@/pages/admin/Financiamientos';
import FinanciamientoNuevo  from '@/pages/admin/FinanciamientoNuevo';
import FinanciamientoDetalle from '@/pages/admin/FinanciamientoDetalle';
import RegistrarPago        from '@/pages/admin/RegistrarPago';
import Empresa              from '@/pages/admin/Empresa';

// Páginas portal cliente
import LoginCliente   from '@/pages/cliente/LoginCliente';
import PrimerAcceso   from '@/pages/cliente/PrimerAcceso';
import EstadoCuenta   from '@/pages/cliente/EstadoCuenta';
import MisFinanciamientos   from '@/pages/cliente/MisFinanciamientos';
import DetalleFinanciamiento from '@/pages/cliente/DetalleFinanciamiento';

// Guards
function RequireAdmin({ children }) {
  const token = useAdminStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireCliente({ children }) {
  const { token, mustChange } = useClienteStore((s) => s);
  if (!token) return <Navigate to="/portal/login" replace />;
  if (mustChange) return <Navigate to="/portal/cambiar-password" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        {/* ── Admin ── */}
        <Route path="/login" element={<LoginAdmin />} />

        <Route
          path="/"
          element={<RequireAdmin><AdminLayout /></RequireAdmin>}
        >
          <Route index                                    element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"                         element={<Dashboard />} />
          <Route path="clientes"                          element={<Clientes />} />
          <Route path="clientes/:id"                      element={<ClienteDetalle />} />
          <Route path="productos"                         element={<Productos />} />
          <Route path="financiamientos"                   element={<Financiamientos />} />
          <Route path="financiamientos/nuevo"             element={<FinanciamientoNuevo />} />
          <Route path="financiamientos/:id"               element={<FinanciamientoDetalle />} />
          <Route path="financiamientos/:id/pago"          element={<RegistrarPago />} />
          <Route path="empresa"                           element={<Empresa />} />
        </Route>

        {/* ── Portal cliente ── */}
        <Route path="/portal/login"      element={<LoginCliente />} />
        <Route path="/portal/acceso"     element={<PrimerAcceso />} />

        <Route
          path="/portal"
          element={<RequireCliente><PortalLayout /></RequireCliente>}
        >
          <Route index                           element={<Navigate to="/portal/estado-cuenta" replace />} />
          <Route path="estado-cuenta"            element={<EstadoCuenta />} />
          <Route path="financiamientos"          element={<MisFinanciamientos />} />
          <Route path="financiamientos/:id"      element={<DetalleFinanciamiento />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
