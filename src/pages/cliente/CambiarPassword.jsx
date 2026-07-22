import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema = z.object({
  password_actual:  z.string().min(1, 'Requerida'),
  password_nueva:   z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password_nueva === d.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm'],
});

export default function CambiarPassword() {
  const navigate    = useNavigate();
  const { cliente, setAuth, clearAuth } = useClienteStore();
  const mustChange  = useClienteStore((s) => s.mustChange);
  const [loading,   setLoading]  = useState(false);
  const [apiError,  setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      await authCliente.cambiarPass({
        password_actual: data.password_actual,
        password_nueva:  data.password_nueva,
      });
      toast.success('Contraseña actualizada correctamente');

      if (mustChange) {
        // Actualizar estado en el store para quitar el flag
        setAuth(useClienteStore.getState().token, cliente, false);
      }
      navigate('/portal/estado-cuenta');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>🔐</div>
        <h1 style={s.title}>
          {mustChange ? 'Crea tu contraseña' : 'Cambiar contraseña'}
        </h1>
        <p style={s.sub}>
          {mustChange
            ? 'Por seguridad, debes crear una contraseña personal antes de continuar.'
            : 'Ingresa tu contraseña actual y después la nueva.'
          }
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ textAlign: 'left' }}>
          <F label={mustChange ? 'Contraseña temporal (la que usaste para entrar)' : 'Contraseña actual'}
             error={errors.password_actual?.message}>
            <input
              {...register('password_actual')}
              type="password"
              style={s.input}
              autoFocus
            />
          </F>
          <F label="Nueva contraseña" error={errors.password_nueva?.message}>
            <input
              {...register('password_nueva')}
              type="password"
              placeholder="Mínimo 8 caracteres"
              style={s.input}
            />
          </F>
          <F label="Confirmar nueva contraseña" error={errors.password_confirm?.message}>
            <input
              {...register('password_confirm')}
              type="password"
              style={s.input}
            />
          </F>

          {apiError && <p style={s.apiError}>{apiError}</p>}

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>

          {/* Solo mostrar cancelar si NO es cambio obligatorio */}
          {!mustChange && (
            <button
              type="button"
              style={s.btnSec}
              onClick={() => navigate('/portal/estado-cuenta')}
            >
              Cancelar
            </button>
          )}

          {mustChange && (
            <p style={s.logoutNote}>
              <button
                type="button"
                style={s.btnLogout}
                onClick={() => { clearAuth(); navigate('/portal/login'); }}
              >
                Cerrar sesión
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function F({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errMsg}>{error}</p>}
    </div>
  );
}

const s = {
  shell:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 16 },
  card:      { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', textAlign: 'center' },
  logo:      { fontSize: 40, marginBottom: 8 },
  title:     { margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1a2035' },
  sub:       { margin: '0 0 24px', color: '#718096', fontSize: 14, lineHeight: 1.5 },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 },
  input:     { width: '100%', padding: '11px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  errMsg:    { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  apiError:  { background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13, marginBottom: 12 },
  btn:       { width: '100%', padding: '12px', marginTop: 4, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 8 },
  btnSec:    { width: '100%', padding: '10px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  logoutNote:{ textAlign: 'center', marginTop: 16 },
  btnLogout: { background: 'none', border: 'none', color: '#a0aec0', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' },
};
