import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authAdmin } from '@/services/api';
import { useAdminStore } from '@/store/authStore';

const schema = z.object({
  usuario_key: z.string().min(1, 'Usuario requerido'),
  password:    z.string().min(1, 'Contraseña requerida'),
});

export default function LoginAdmin() {
  const navigate  = useNavigate();
  const setAuth   = useAdminStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const r = await authAdmin.login(data);
      setAuth(r.data.token, r.data.user);
      toast.success(`Bienvenido, ${r.data.user.nombre}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>💳</div>
        <h1 style={s.title}>PagosApp</h1>
        <p style={s.sub}>Panel de administración</p>

        <form onSubmit={handleSubmit(onSubmit)} style={s.form}>
          <Field label="Usuario" error={errors.usuario_key?.message}>
            <input
              {...register('usuario_key')}
              placeholder="Tu usuario"
              style={s.input}
              autoComplete="username"
            />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={s.input}
              autoComplete="current-password"
            />
          </Field>

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={s.portalLink}>
          ¿Eres cliente?{' '}
          <a href="/portal/login" style={{ color: '#3182ce' }}>
            Accede a tu portal
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#e53e3e', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const s = {
  shell: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a2035 0%, #2d3748 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 380, textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo:  { fontSize: 40, marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1a2035' },
  sub:   { margin: '0 0 28px', color: '#718096', fontSize: 14 },
  form:  { textAlign: 'left' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '12px', marginTop: 8,
    background: '#1a2035', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  portalLink: { marginTop: 20, fontSize: 13, color: '#718096' },
};
