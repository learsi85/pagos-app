// LoginCliente.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerida'),
});

export default function LoginCliente() {
  const navigate  = useNavigate();
  const setAuth   = useClienteStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const r = await authCliente.login(data);
      setAuth(r.data.token, r.data.cliente, r.data.must_change);
      if (r.data.must_change) {
        navigate('/portal/cambiar-password');
      } else {
        navigate('/portal/estado-cuenta');
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'PRIMER_ACCESO') {
        toast.error('Debes completar tu primer acceso. Usa el enlace que te enviaron.');
      } else {
        toast.error(err.response?.data?.error || 'Credenciales incorrectas');
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
            <input {...register('email')} type="email" placeholder="tu@correo.com" style={s.input} />
          </F>
          <F label="Contraseña" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="••••••••" style={s.input} />
          </F>
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={s.note}>
          ¿Primera vez?{' '}
          <Link to="/portal/acceso" style={{ color: '#3182ce' }}>Completa tu registro aquí</Link>
        </p>
        <p style={s.note}>
          <Link to="/login" style={{ color: '#718096', fontSize: 12 }}>← Acceso administrativo</Link>
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
  shell: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif" },
  card:  { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' },
  logo:  { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a2035', textAlign: 'center' },
  sub:   { margin: '0 0 28px', color: '#718096', fontSize: 13, textAlign: 'center' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:   { width: '100%', padding: '12px', marginTop: 6, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  note:  { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#718096' },
};
