import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { clientesApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const schema = z.object({
  Nombre:          z.string().min(1, 'Requerido'),
  ApellidoPaterno: z.string().min(1, 'Requerido'),
  ApellidoMaterno: z.string().optional(),
  RFC:             z.string().optional(),
  Email:           z.string().email('Email inválido'),
  Telefono:        z.string().optional(),
  Direccion:       z.string().optional(),
});

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes,  setClientes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [q,         setQ]         = useState('');
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const load = async (query = '') => {
    setLoading(true);
    try {
      const r = await clientesApi.list(query ? { q: query } : {});
      setClientes(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = (e) => { e.preventDefault(); load(q); };

  const onStore = async (data) => {
    setSaving(true);
    try {
      const r = await clientesApi.create(data);
      setTokenInfo({ email: data.Email, token: r.data.token_primer_acceso, expira: r.data.token_expira });
      reset();
      load();
      toast.success('Cliente registrado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Clientes</h1>
        <button style={s.btnPri} onClick={() => { setModal(true); setTokenInfo(null); }}>
          + Nuevo cliente
        </button>
      </div>

      <form onSubmit={onSearch} style={s.searchBar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o RFC…"
          style={s.searchInput}
        />
        <button type="submit" style={s.btnSec}>Buscar</button>
      </form>

      <div style={s.tableCard}>
        {/* Scroll horizontal en móvil */}
        <div style={s.tableScroll}>
          {loading ? (
            <p style={s.empty}>Cargando…</p>
          ) : clientes.length === 0 ? (
            <p style={s.empty}>Sin resultados</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Nombre','RFC','Email','Teléfono','Status','Desde',''].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr
                    key={c.ClienteId}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#2d3748', whiteSpace: 'nowrap' }}>
                        {c.ApellidoPaterno} {c.ApellidoMaterno || ''}, {c.Nombre}
                      </div>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{c.RFC || '—'}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{c.Email}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{c.Telefono || '—'}</td>
                    <td style={s.td}>{statusBadge(c.Status)}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(c.CreatedAt)}</td>
                    <td style={s.td}>
                      <button
                        onClick={() => navigate(`/clientes/${c.ClienteId}`)}
                        style={s.btnLink}
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal title="Nuevo cliente" onClose={() => { setModal(false); setTokenInfo(null); }}>
          {tokenInfo ? (
            <div style={s.tokenBox}>
              <p style={{ marginTop: 0, fontWeight: 600 }}>✅ Cliente creado exitosamente</p>
              <p style={{ fontSize: 13, color: '#4a5568' }}>
                Comparte este enlace con <strong>{tokenInfo.email}</strong>:
              </p>
              <code style={s.tokenCode}>
                {window.location.origin}/portal/acceso?token={tokenInfo.token}&email={encodeURIComponent(tokenInfo.email)}
              </code>
              <p style={{ fontSize: 12, color: '#718096', marginBottom: 0 }}>
                Expira: {fmt.dateTime(tokenInfo.expira)}
              </p>
              <button
                style={{ ...s.btnPri, marginTop: 16, width: '100%' }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/portal/acceso?token=${tokenInfo.token}&email=${encodeURIComponent(tokenInfo.email)}`
                  );
                  toast.success('Enlace copiado');
                }}
              >
                Copiar enlace
              </button>
              <button
                style={{ ...s.btnSec, marginTop: 8, width: '100%' }}
                onClick={() => { setModal(false); setTokenInfo(null); }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onStore)}>
              <div style={s.formGrid}>
                <F label="Nombre *"           error={errors.Nombre?.message}>
                  <input {...register('Nombre')} style={s.input} />
                </F>
                <F label="Apellido paterno *" error={errors.ApellidoPaterno?.message}>
                  <input {...register('ApellidoPaterno')} style={s.input} />
                </F>
                <F label="Apellido materno">
                  <input {...register('ApellidoMaterno')} style={s.input} />
                </F>
                <F label="RFC">
                  <input {...register('RFC')} style={s.input} placeholder="XXXX000000XXX" />
                </F>
                <F label="Email *" error={errors.Email?.message} full>
                  <input {...register('Email')} type="email" style={s.input} />
                </F>
                <F label="Teléfono">
                  <input {...register('Telefono')} style={s.input} />
                </F>
                <F label="Dirección" full>
                  <input {...register('Direccion')} style={s.input} />
                </F>
              </div>
              <div style={s.formActions}>
                <button type="button" style={s.btnSec} onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" style={s.btnPri} disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear cliente'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

function F({ label, error, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errorMsg}>{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>{title}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const s = {
  wrap:        { padding: '24px 20px', fontFamily: "'Inter','Segoe UI',sans-serif" },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:       { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a2035' },
  btnPri:      { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSec:      { padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnLink:     { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  searchBar:   { display: 'flex', gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', minWidth: 0 },
  tableCard:   { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableScroll: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 },
  th:          { padding: '12px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa', whiteSpace: 'nowrap' },
  td:          { padding: '12px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  empty:       { padding: '40px', textAlign: 'center', color: '#718096', margin: 0 },
  formGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px 16px', marginBottom: 20 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  input:       { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  errorMsg:    { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal:       { background: '#fff', borderRadius: 12, padding: '28px 24px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a2035' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#718096' },
  tokenBox:    { background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, padding: 20 },
  tokenCode:   { display: 'block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', fontSize: 11, wordBreak: 'break-all', margin: '8px 0' },
};