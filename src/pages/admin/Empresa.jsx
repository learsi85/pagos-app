import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { empresaApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/authStore';

export default function Empresa() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const navigate  = useNavigate();
  const clearAuth = useAdminStore((s) => s.clearAuth);

  useEffect(() => {
    empresaApi.get()
      .then((r) => reset(r.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          // No existe aún — formulario vacío, listo para crear
          //console.log(err);
          reset({});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const r = await empresaApi.update(data);
      if (r.data.nota) {
        // Se creó/vinculó la empresa por primera vez —
        // el JWT actual no tiene el empresa_id correcto
        toast.success('Empresa registrada. Vuelve a iniciar sesión para continuar.');
        clearAuth();
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.success('Datos actualizados');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Wrap><p style={{ color: '#888' }}>Cargando…</p></Wrap>;

  return (
    <Wrap>
      <h1 style={s.title}>Mi empresa</h1>
      <div style={s.card}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={s.grid}>
            <F label="Razón social *" full>
              <input {...register('RazonSocial')} style={s.input} />
            </F>
            <F label="RFC *">
              <input {...register('RFC')} style={s.input} placeholder="XXXX000000XXX" />
            </F>
            <F label="Email de contacto *">
              <input {...register('Email')} type="email" style={s.input} />
            </F>
            <F label="Teléfono">
              <input {...register('Telefono')} style={s.input} />
            </F>
            <F label="Dirección" full>
              <textarea {...register('Direccion')} style={{ ...s.input, minHeight: 70, resize: 'vertical' }} />
            </F>
          </div>
          <div style={s.actions}>
            <button type="submit" style={s.btnPri} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </Wrap>
  );
}

function Wrap({ children }) {
  return <div style={{ padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}
function F({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  title:   { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a2035' },
  card:    { background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', maxWidth: 640 },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 20 },
  label:   { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  input:   { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  btnPri:  { padding: '10px 24px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
