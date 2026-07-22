import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';

const schema = z.object({
  email: z.string().email('Ingresa un email válido'),
});

export default function OlvidePassword() {
  const [enviado,  setEnviado]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      await authCliente.solicitarReset(data);
      setEnviado(true);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>🔒</div>
        <h1 style={s.title}>¿Olvidaste tu contraseña?</h1>

        {enviado ? (
          <div style={s.successBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <p style={s.successText}>
              Si tu correo está registrado, recibirás un enlace para restablecer
              tu contraseña en los próximos minutos.
            </p>
            <p style={s.successNote}>
              Revisa también tu carpeta de spam.
            </p>
            <Link to="/portal/login" style={s.backLink}>← Regresar al login</Link>
          </div>
        ) : (
          <>
            <p style={s.sub}>
              Ingresa el correo con el que accedes a tu portal y te enviaremos
              un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Correo electrónico</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu@correo.com"
                  style={s.input}
                  autoFocus
                />
                {errors.email && <p style={s.errMsg}>{errors.email.message}</p>}
              </div>

              {apiError && <p style={s.apiError}>{apiError}</p>}

              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? 'Enviando…' : 'Enviar enlace de restablecimiento'}
              </button>
            </form>

            <p style={s.foot}>
              <Link to="/portal/login" style={s.link}>← Regresar al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  shell:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#ebf8ff,#bee3f8)', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 16 },
  card:        { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', textAlign: 'center' },
  logo:        { fontSize: 40, marginBottom: 8 },
  title:       { margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1a2035' },
  sub:         { margin: '0 0 24px', color: '#718096', fontSize: 14, lineHeight: 1.5, textAlign: 'left' },
  label:       { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6, textAlign: 'left' },
  input:       { width: '100%', padding: '11px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  errMsg:      { color: '#e53e3e', fontSize: 12, marginTop: 4, textAlign: 'left' },
  apiError:    { background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13, marginBottom: 16, textAlign: 'left' },
  btn:         { width: '100%', padding: '12px', marginTop: 4, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  foot:        { marginTop: 20, fontSize: 13 },
  link:        { color: '#3182ce', textDecoration: 'none' },
  successBox:  { textAlign: 'center', padding: '8px 0' },
  successText: { color: '#2d3748', fontSize: 15, lineHeight: 1.6, margin: '0 0 8px' },
  successNote: { color: '#718096', fontSize: 13, margin: '0 0 20px' },
  backLink:    { color: '#3182ce', fontSize: 14, textDecoration: 'none' },
};
