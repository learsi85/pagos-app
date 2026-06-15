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
  const [clientes, setClientes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
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

  const onSearch = (e) => {
    e.preventDefault();
    load(q);
  };

  const onStore = async (data) => {
    setSaving(true);
    try {
      const r = await clientesApi.create(data);
      setTokenInfo({
        email:  data.Email,
        token:  r.data.token_primer_acceso,
        expira: r.data.token_expira,
      });
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
    <div style={pg.wrap}>
      <div style={pg.header}>
        <h1 style={pg.title}>Clientes</h1>
        <button style={pg.btnPrimary} onClick={() => { setModal(true); setTokenInfo(null); }}>
          + Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <form onSubmit={onSearch} style={pg.searchBar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o RFC…"
          style={pg.searchInput}
        />
        <button type="submit" style={pg.btnSecondary}>Buscar</button>
      </form>

      {/* Tabla */}
      <div style={pg.tableCard}>
        {loading ? (
          <p style={pg.empty}>Cargando…</p>
        ) : clientes.length === 0 ? (
          <p style={pg.empty}>Sin resultados</p>
        ) : (
          <table style={pg.table}>
            <thead>
              <tr>
                {['Nombre','RFC','Email','Teléfono','Status','Desde',''].map((h) => (
                  <th key={h} style={pg.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr
                  key={c.ClienteId}
                  style={pg.tr}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={pg.td}>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>
                      {c.ApellidoPaterno} {c.ApellidoMaterno || ''}, {c.Nombre}
                    </div>
                  </td>
                  <td style={pg.td}>{c.RFC || '—'}</td>
                  <td style={pg.td}>{c.Email}</td>
                  <td style={pg.td}>{c.Telefono || '—'}</td>
                  <td style={pg.td}>{statusBadge(c.Status)}</td>
                  <td style={pg.td}>{fmt.date(c.CreatedAt)}</td>
                  <td style={pg.td}>
                    <button
                      onClick={() => navigate(`/clientes/${c.ClienteId}`)}
                      style={pg.btnLink}
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

      {/* Modal nuevo cliente */}
      {modal && (
        <Modal title="Nuevo cliente" onClose={() => { setModal(false); setTokenInfo(null); }}>
          {tokenInfo ? (
            <div style={pg.tokenBox}>
              <p style={{ marginTop: 0, fontWeight: 600 }}>✅ Cliente creado exitosamente</p>
              <p style={{ fontSize: 13, color: '#4a5568' }}>
                Comparte este enlace de primer acceso con <strong>{tokenInfo.email}</strong>:
              </p>
              <code style={pg.tokenCode}>
                {window.location.origin}/portal/acceso?token={tokenInfo.token}&email={encodeURIComponent(tokenInfo.email)}
              </code>
              <p style={{ fontSize: 12, color: '#718096', marginBottom: 0 }}>
                Expira: {fmt.dateTime(tokenInfo.expira)}
              </p>
              <button
                style={{ ...pg.btnPrimary, marginTop: 16, width: '100%' }}
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
                style={{ ...pg.btnSecondary, marginTop: 8, width: '100%' }}
                onClick={() => { setModal(false); setTokenInfo(null); }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onStore)}>
              <div style={pg.formGrid}>
                <F label="Nombre *"          error={errors.Nombre?.message}>
                  <input {...register('Nombre')} style={pg.input} />
                </F>
                <F label="Apellido paterno *" error={errors.ApellidoPaterno?.message}>
                  <input {...register('ApellidoPaterno')} style={pg.input} />
                </F>
                <F label="Apellido materno"  error={errors.ApellidoMaterno?.message}>
                  <input {...register('ApellidoMaterno')} style={pg.input} />
                </F>
                <F label="RFC" error={errors.RFC?.message}>
                  <input {...register('RFC')} style={pg.input} placeholder="XXXX000000XXX" />
                </F>
                <F label="Email *" error={errors.Email?.message} full>
                  <input {...register('Email')} type="email" style={pg.input} />
                </F>
                <F label="Teléfono" error={errors.Telefono?.message}>
                  <input {...register('Telefono')} style={pg.input} />
                </F>
                <F label="Dirección" error={errors.Direccion?.message} full>
                  <input {...register('Direccion')} style={pg.input} />
                </F>
              </div>
              <div style={pg.formActions}>
                <button type="button" style={pg.btnSecondary} onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" style={pg.btnPrimary} disabled={saving}>
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
      <label style={pg.label}>{label}</label>
      {children}
      {error && <p style={pg.errorMsg}>{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={pg.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={pg.modal}>
        <div style={pg.modalHeader}>
          <h2 style={pg.modalTitle}>{title}</h2>
          <button onClick={onClose} style={pg.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const pg = {
  wrap:        { padding: '32px 40px', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:       { margin: 0, fontSize: 24, fontWeight: 700, color: '#1a2035' },
  btnPrimary:  { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:{ padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnLink:     { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  searchBar:   { display: 'flex', gap: 8, marginBottom: 20 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' },
  tableCard:   { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:          { padding: '12px 16px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:          { padding: '12px 16px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  tr:          { transition: 'background 0.1s', cursor: 'default' },
  empty:       { padding: '40px', textAlign: 'center', color: '#718096', margin: 0 },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 20 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  input:       { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  errorMsg:    { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:  { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a2035' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#718096' },
  tokenBox:    { background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, padding: 20 },
  tokenCode:   { display: 'block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', fontSize: 12, wordBreak: 'break-all', margin: '8px 0' },
};
