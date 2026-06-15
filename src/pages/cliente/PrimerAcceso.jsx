import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema = z.object({
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  passwordConfirm: z.string(),
  rfc:             z.string().optional(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

export default function PrimerAcceso() {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const setAuth   = useClienteStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token || !email) {
      toast.error('Enlace de acceso inválido o incompleto');
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const r = await authCliente.primerAcceso({
        token,
        email,
        password: data.password,
        rfc:      data.rfc || '',
      });
      setAuth(r.data.token, { email }, false);
      toast.success('¡Cuenta activada! Bienvenido.');
      navigate('/portal/estado-cuenta');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al activar cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>🔑</div>
        <h1 style={s.title}>Activa tu cuenta</h1>
        <p style={s.sub}>
          Crea tu contraseña para acceder a tu portal de pagos
        </p>
        {email && (
          <div style={s.emailBox}>
            Cuenta: <strong>{email}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <F label="RFC (opcional, para verificación)" error={errors.rfc?.message}>
            <input {...register('rfc')} placeholder="XXXX000000XXX" style={s.input} />
          </F>
          <F label="Nueva contraseña *" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" style={s.input} />
          </F>
          <F label="Confirmar contraseña *" error={errors.passwordConfirm?.message}>
            <input {...register('passwordConfirm')} type="password" style={s.input} />
          </F>
          <button type="submit" disabled={loading || !token || !email} style={s.btn}>
            {loading ? 'Activando…' : 'Activar mi cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#718096' }}>
          ¿Ya tienes contraseña?{' '}
          <a href="/portal/login" style={{ color: '#3182ce' }}>Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}

function F({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#e53e3e', fontSize: 12, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

const s = {
  shell:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif" },
  card:     { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' },
  logo:     { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title:    { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a2035', textAlign: 'center' },
  sub:      { margin: '0 0 16px', color: '#718096', fontSize: 13, textAlign: 'center' },
  emailBox: { background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2b6cb0', marginBottom: 20 },
  input:    { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:      { width: '100%', padding: '12px', marginTop: 6, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};
