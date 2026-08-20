import axios from 'axios';

// ── Instancia base ────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const adminToken   = localStorage.getItem('admin_token');
  const clienteToken = localStorage.getItem('cliente_token');
  const token = adminToken || clienteToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir solo si había token activo (no en intento de login fallido)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isCliente = window.location.pathname.startsWith('/portal');
    const tokenKey  = isCliente ? 'cliente_token' : 'admin_token';
    const loginPath = isCliente ? '/portal/login' : '/login';
    const hadToken  = !!localStorage.getItem(tokenKey);

    if (err.response?.status === 401 && hadToken) {
      localStorage.removeItem(tokenKey);
      window.location.href = loginPath;
    }
    return Promise.reject(err);
  }
);

// ── Auth Admin ────────────────────────────────────────────────
export const authAdmin = {
  login:  (data) => api.post('/auth/admin/login', data),
  me:     ()     => api.get('/auth/admin/me'),
  logout: ()     => api.post('/auth/admin/logout'),
};

// ── Auth Cliente ──────────────────────────────────────────────
export const authCliente = {
  login:          (data)   => api.post('/auth/cliente/login', data),
  primerAcceso:   (data)   => api.post('/auth/cliente/primer-acceso', data),
  solicitarReset: (data)   => api.post('/auth/cliente/solicitar-reset', data),
  confirmarReset: (data)   => api.post('/auth/cliente/confirmar-reset', data),
  validarToken:   (params) => api.get('/auth/cliente/validar-token', { params }),
  cambiarPass:    (data)   => api.post('/auth/cliente/cambiar-password', data),
};

// ── Empresa ───────────────────────────────────────────────────
export const empresaApi = {
  get:    ()     => api.get('/admin/empresa'),
  update: (data) => api.put('/admin/empresa', data),
};

// ── Clientes ──────────────────────────────────────────────────
export const clientesApi = {
  list:   (params)   => api.get('/admin/clientes', { params }),
  create: (data)     => api.post('/admin/clientes', data),
  get:    (id)       => api.get(`/admin/clientes/${id}`),
  update: (id, data) => api.put(`/admin/clientes/${id}`, data),
};

// ── Productos ─────────────────────────────────────────────────
export const productosApi = {
  list:   (params)   => api.get('/admin/productos', { params }),
  create: (data)     => api.post('/admin/productos', data),
  get:    (id)       => api.get(`/admin/productos/${id}`),
  update: (id, data) => api.put(`/admin/productos/${id}`, data),
  delete: (id)       => api.delete(`/admin/productos/${id}`),
};

// ── Financiamientos ───────────────────────────────────────────
export const financiamientosApi = {
  list:    (params)            => api.get('/admin/financiamientos', { params }),
  create:  (data)              => api.post('/admin/financiamientos', data),
  get:     (id)                => api.get(`/admin/financiamientos/${id}`),
  update:  (id, data)          => api.put(`/admin/financiamientos/${id}`, data),
  plan:    (id)                => api.get(`/admin/financiamientos/${id}/plan`),
  simular: (data)              => api.post('/admin/financiamientos/simular', data),
  pagos:   (id)                => api.get(`/admin/financiamientos/${id}/pagos`),
  cargos:  (id)                => api.get(`/admin/financiamientos/${id}/cargos`),

  // CORRECCIÓN: pasa fecha_pago como query param para calcular días reales de atraso
  calcularMoratorio: (finId, planId, params = {}) =>
    api.get(`/admin/financiamientos/${finId}/moratorio/${planId}`, { params }),
};

// ── Pagos ─────────────────────────────────────────────────────
export const pagosApi = {
  list: (params) => api.get('/admin/pagos', { params }),
  get:  (id)     => api.get(`/admin/pagos/${id}`),

  // multipart/form-data para soportar comprobante adjunto
  create: (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) form.append(k, v);
    });
    return api.post('/admin/pagos', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Métodos de pago ───────────────────────────────────────────
export const metodosApi = {
  list: () => api.get('/admin/metodos-pago'),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/admin/dashboard'),
};

// ── Portal Cliente ────────────────────────────────────────────
export const portalApi = {
  perfil:          ()   => api.get('/cliente/perfil'),
  financiamientos: ()   => api.get('/cliente/financiamientos'),
  financiamiento:  (id) => api.get(`/cliente/financiamientos/${id}`),
  plan:            (id) => api.get(`/cliente/financiamientos/${id}/plan`),
  pagos:           (id) => api.get(`/cliente/financiamientos/${id}/pagos`),
  estadoCuenta:    ()   => api.get('/cliente/estado-cuenta'),
};

export default api;
