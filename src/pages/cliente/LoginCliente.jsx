import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema = z.object({
  email:    z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export default function LoginCliente() {
  const navigate  = useNavigate();
  const setAuth   = useClienteStore((s) => s.setAuth);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      const r = await authCliente.login(data);
      setAuth(r.data.token, r.data.cliente, r.data.must_change);

      if (r.data.must_change) {
        // Redirigir a cambiar contraseña obligatorio
        navigate('/portal/cambiar-password');
      } else {
        navigate('/portal/estado-cuenta');
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'PRIMER_ACCESO') {
        setApiError('Tu cuenta aún no ha sido activada. Usa el enlace de activación que te enviaron.');
      } else {
        setApiError(err.response?.data?.error || 'Credenciales incorrectas');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>💳</div>
        <h1 style={s.title}>Portal del cliente</h1>
        <p style={s.sub}>Consulta tu estado de cuenta y plan de pagos</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <F label="Correo electrónico" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="tu@correo.com"
              style={s.input}
              autoComplete="email"
            />
          </F>
          <F label="Contraseña" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={s.input}
              autoComplete="current-password"
            />
          </F>

          {apiError && <p style={s.apiError}>{apiError}</p>}

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Link olvidé mi contraseña */}
        <p style={s.note}>
          <Link to="/portal/olvide-password" style={s.link}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p style={s.note}>
          ¿Primera vez?{' '}
          <Link to="/portal/acceso" style={s.link}>Activa tu cuenta aquí</Link>
        </p>

        <p style={{ ...s.note, marginTop: 20 }}>
          <Link to="/login" style={{ ...s.link, color: '#a0aec0', fontSize: 12 }}>
            ← Acceso administrativo
          </Link>
        </p>
      </div>
    </div>
  );
}

function F({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errMsg}>{error}</p>}
    </div>
  );
}

const s = {
  shell:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 16 },
  card:     { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 380, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', textAlign: 'center' },
  logo:     { fontSize: 40, marginBottom: 8 },
  title:    { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  sub:      { margin: '0 0 28px', color: '#718096', fontSize: 13 },
  label:    { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6, textAlign: 'left' },
  input:    { width: '100%', padding: '11px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  errMsg:   { color: '#e53e3e', fontSize: 12, marginTop: 4, textAlign: 'left' },
  apiError: { background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13, marginBottom: 12, textAlign: 'left' },
  btn:      { width: '100%', padding: '12px', marginTop: 4, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  note:     { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#718096' },
  link:     { color: '#3182ce', textDecoration: 'none' },
};
