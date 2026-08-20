import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAdminStore = create(persist(
  (set) => ({
    token:null,user:null,empresaId:null,tenantKey:null,tenantId:null,
    setAuth:(token,user)=>set({token,user,empresaId:user.empresa_id,tenantKey:user.tenant_key,tenantId:user.tenant_id}),
    clearAuth:()=>{localStorage.removeItem('admin_token');set({token:null,user:null,empresaId:null,tenantKey:null,tenantId:null});}
  }),
  {name:'admin-auth',partialize:(s)=>({token:s.token,user:s.user,empresaId:s.empresaId,tenantKey:s.tenantKey,tenantId:s.tenantId})}
));
useAdminStore.subscribe((s)=>s.token?localStorage.setItem('admin_token',s.token):localStorage.removeItem('admin_token'));
export const useClienteStore = create(persist(
  (set,get)=>({
    token:null,cliente:null,mustChange:false,
    setAuth:(token,cliente,mustChange=false)=>set({token,cliente,mustChange}),
    clearAuth:()=>{localStorage.removeItem('cliente_token');set({token:null,cliente:null,mustChange:false});}
  }),
  {name:'cliente-auth',partialize:(s)=>({token:s.token,cliente:s.cliente,mustChange:s.mustChange})}
));
useClienteStore.subscribe((s)=>s.token?localStorage.setItem('cliente_token',s.token):localStorage.removeItem('cliente_token'));
