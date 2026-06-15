import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Admin ────────────────────────────────────────────────
export const useAdminStore = create(
  persist(
    (set) => ({
      token:     null,
      user:      null,
      empresaId: null,
      tenant:    null,

      setAuth: (token, user) =>
        set({ token, user, empresaId: user.empresa_id, tenantKey: user.tenant_key, tenantId: user.tenant_id }),

      clearAuth: () => {
        localStorage.removeItem('admin_token');
        set({ token: null, user: null, empresaId: null, tenantKey: null, tenantId: null });
      },
    }),
    {
      name:    'admin-auth',
      // solo guardar el token en localStorage, el resto en memoria
      partialize: (s) => ({ token: s.token, user: s.user, empresaId: s.empresaId, tenantKey: s.tenantKey, tenantId: s.tenantId }),
    }
  )
);

// Sincronizar token con axios
useAdminStore.subscribe((state) => {
  if (state.token) {
    localStorage.setItem('admin_token', state.token);
  } else {
    localStorage.removeItem('admin_token');
  }
});

// ── Auth Cliente ──────────────────────────────────────────────
export const useClienteStore = create(
  persist(
    (set) => ({
      token:      null,
      cliente:    null,
      mustChange: false,

      setAuth: (token, cliente, mustChange = false) =>
        set({ token, cliente, mustChange }),

      clearAuth: () => {
        localStorage.removeItem('cliente_token');
        set({ token: null, cliente: null, mustChange: false });
      },
    }),
    {
      name:       'cliente-auth',
      partialize: (s) => ({ token: s.token, cliente: s.cliente, mustChange: s.mustChange }),
    }
  )
);

useClienteStore.subscribe((state) => {
  if (state.token) {
    localStorage.setItem('cliente_token', state.token);
  } else {
    localStorage.removeItem('cliente_token');
  }
});
