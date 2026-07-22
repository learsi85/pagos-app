import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';

const schema = z.object({
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  passwordConfirm: z.string(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

export default function ResetPassword() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const token      = params.get('token') || '';
  const email      = params.get('email') || '';

  const [estado,   setEstado]  = useState('validando'); // validando | valido | invalido | exito
  const [nombre,   setNombre]  = useState('');
  const [loading,  setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Validar token al montar
  useEffect(() => {
    if (!token || !email) { setEstado('invalido'); return; }

    authCliente.validarToken({ token, email })
      .then((r) => {
        if (r.data.valido) {
          setNombre(r.data.nombre || '');
          setEstado('valido');
        } else {
          setEstado('invalido');
        }
      })
      .catch(() => setEstado('invalido'));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      await authCliente.confirmarReset({ token, email, password: data.password });
      setEstado('exito');
      setTimeout(() => navigate('/portal/login'), 2500);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Estados de pantalla ────────────────────────────────────
  if (estado === 'validando') {
    return <Shell><p style={{ color: '#718096' }}>Verificando enlace…</p></Shell>;
  }

  if (estado === 'invalido') {
    return (
      <Shell>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⛔</div>
        <h2 style={s.title}>Enlace inválido o expirado</h2>
        <p style={s.sub}>
          Este enlace ya fue usado o expiró. Solicita uno nuevo desde el login.
        </p>
        <Link to="/portal/olvide-password" style={s.btn}>
          Solicitar nuevo enlace
        </Link>
        <p style={{ marginTop: 16 }}>
          <Link to="/portal/login" style={s.link}>← Regresar al login</Link>
        </p>
      </Shell>
    );
  }

  if (estado === 'exito') {
    return (
      <Shell>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={s.title}>¡Contraseña restablecida!</h2>
        <p style={s.sub}>Tu contraseña se actualizó correctamente. Redirigiendo al login…</p>
      </Shell>
    );
  }

  // Estado 'valido' — mostrar formulario
  return (
    <Shell>
      <div style={s.logo}>🔑</div>
      <h1 style={s.title}>Nueva contraseña</h1>
      {nombre && <p style={s.sub}>Hola <strong>{nombre}</strong>, crea tu nueva contraseña.</p>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ textAlign: 'left' }}>
        <F label="Nueva contraseña" error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            placeholder="Mínimo 8 caracteres"
            style={s.input}
            autoFocus
          />
        </F>
        <F label="Confirmar contraseña" error={errors.passwordConfirm?.message}>
          <input
            {...register('passwordConfirm')}
            type="password"
            placeholder="Repite la contraseña"
            style={s.input}
          />
        </F>

        {apiError && <p style={s.apiError}>{apiError}</p>}

        <button type="submit" disabled={loading} style={{ ...s.btn, display: 'block', width: '100%', textAlign: 'center', textDecoration: 'none', marginTop: 4 }}>
          {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
        <Link to="/portal/login" style={s.link}>← Regresar al login</Link>
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={s.shell}>
      <div style={{ ...s.card, textAlign: 'center' }}>
        {children}
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
  shell:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 16 },
  card:     { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' },
  logo:     { fontSize: 40, marginBottom: 8 },
  title:    { margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1a2035' },
  sub:      { margin: '0 0 24px', color: '#718096', fontSize: 14, lineHeight: 1.5 },
  label:    { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 },
  input:    { width: '100%', padding: '11px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  errMsg:   { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  apiError: { background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13, marginBottom: 12 },
  btn:      { padding: '12px 24px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link:     { color: '#3182ce', textDecoration: 'none', fontSize: 14 },
};
