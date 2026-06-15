import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productosApi } from '@/services/api';
import { fmt } from '@/utils/format';

const schema = z.object({
  Nombre:      z.string().min(1, 'Requerido'),
  Descripcion: z.string().optional(),
  PrecioBase:  z.coerce.number().positive('Debe ser mayor a 0'),
});

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false); // false | 'new' | objeto
  const [saving,    setSaving]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await productosApi.list();
      setProductos(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    reset({ Nombre: '', Descripcion: '', PrecioBase: '' });
    setModal('new');
  };

  const openEdit = (p) => {
    reset(p);
    setModal(p);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (modal === 'new') {
        await productosApi.create(data);
        toast.success('Producto creado');
      } else {
        await productosApi.update(modal.ProductoId, data);
        toast.success('Producto actualizado');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p) => {
    try {
      await productosApi.update(p.ProductoId, { IsActive: p.IsActive ? 0 : 1 });
      toast.success(p.IsActive ? 'Producto desactivado' : 'Producto activado');
      load();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Productos</h1>
        <button style={s.btnPri} onClick={openNew}>+ Nuevo producto</button>
      </div>

      <div style={s.tableCard}>
        {loading ? (
          <p style={s.empty}>Cargando…</p>
        ) : productos.length === 0 ? (
          <p style={s.empty}>Sin productos registrados</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Nombre','Descripción','Precio base','Status','Creado',''].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.ProductoId}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, fontWeight: 600 }}>{p.Nombre}</td>
                  <td style={{ ...s.td, color: '#718096' }}>{p.Descripcion || '—'}</td>
                  <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0' }}>{fmt.money(p.PrecioBase)}</td>
                  <td style={s.td}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                      fontSize: 12, fontWeight: 600,
                      color:  p.IsActive ? '#38a169' : '#718096',
                      background: p.IsActive ? '#f0fff4' : '#f7fafc',
                      border: `1px solid ${p.IsActive ? '#9ae6b4' : '#e2e8f0'}`,
                    }}>
                      {p.IsActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={s.td}>{fmt.date(p.CreatedAt)}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.btnLink} onClick={() => openEdit(p)}>Editar</button>
                      <button
                        style={{ ...s.btnLink, color: p.IsActive ? '#e53e3e' : '#38a169' }}
                        onClick={() => toggleStatus(p)}
                      >
                        {p.IsActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{modal === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <F label="Nombre *" error={errors.Nombre?.message}>
                <input {...register('Nombre')} style={s.input} />
              </F>
              <F label="Descripción" error={errors.Descripcion?.message}>
                <textarea {...register('Descripcion')} style={{ ...s.input, minHeight: 80, resize: 'vertical' }} />
              </F>
              <F label="Precio base (MXN) *" error={errors.PrecioBase?.message}>
                <input {...register('PrecioBase')} type="number" step="0.01" min="0" style={s.input} />
              </F>
              <div style={s.formActions}>
                <button type="button" style={s.btnSec} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={s.btnPri} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  wrap:       { padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:      { margin: 0, fontSize: 24, fontWeight: 700, color: '#1a2035' },
  btnPri:     { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSec:     { padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnLink:    { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0 },
  tableCard:  { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '12px 16px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:         { padding: '12px 16px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  empty:      { padding: 40, textAlign: 'center', color: '#718096', margin: 0 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 460 },
  modalHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a2035' },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#718096' },
  label:      { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  input:      { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  errMsg:     { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  formActions:{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
