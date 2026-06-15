import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientesApi, financiamientosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function ClienteDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [fins,    setFins]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    Promise.all([
      clientesApi.get(id),
      financiamientosApi.list({ cliente_id: id }),
    ]).then(([rc, rf]) => {
      setCliente(rc.data);
      setFins(rf.data);
      reset(rc.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const onSave = async (data) => {
    setSaving(true);
    try {
      await clientesApi.update(id, data);
      setCliente((prev) => ({ ...prev, ...data }));
      setEditing(false);
      toast.success('Cliente actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Wrap><p style={{ color: '#888' }}>Cargando…</p></Wrap>;
  if (!cliente) return <Wrap><p style={{ color: '#e53e3e' }}>Cliente no encontrado</p></Wrap>;

  return (
    <Wrap>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate('/clientes')} style={s.back}>← Clientes</button>
        <div style={s.titleRow}>
          <h1 style={s.title}>
            {cliente.ApellidoPaterno} {cliente.ApellidoMaterno || ''}, {cliente.Nombre}
          </h1>
          {statusBadge(cliente.Status)}
        </div>
      </div>

      {/* Datos del cliente */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Datos generales</h2>
          {!editing && (
            <button style={s.btnSec} onClick={() => setEditing(true)}>Editar</button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSave)}>
            <div style={s.grid}>
              <F label="Nombre"><input {...register('Nombre')} style={s.input} /></F>
              <F label="Apellido paterno"><input {...register('ApellidoPaterno')} style={s.input} /></F>
              <F label="Apellido materno"><input {...register('ApellidoMaterno')} style={s.input} /></F>
              <F label="RFC"><input {...register('RFC')} style={s.input} /></F>
              <F label="Email"><input {...register('Email')} type="email" style={s.input} /></F>
              <F label="Teléfono"><input {...register('Telefono')} style={s.input} /></F>
              <F label="Dirección" full><input {...register('Direccion')} style={s.input} /></F>
              <F label="Status">
                <select {...register('Status')} style={s.input}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </F>
            </div>
            <div style={s.actions}>
              <button type="button" style={s.btnSec} onClick={() => { setEditing(false); reset(cliente); }}>
                Cancelar
              </button>
              <button type="submit" style={s.btnPri} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : (
          <div style={s.grid}>
            <DL label="RFC"       value={cliente.RFC || '—'} />
            <DL label="Email"     value={cliente.Email} />
            <DL label="Teléfono"  value={cliente.Telefono || '—'} />
            <DL label="Dirección" value={cliente.Direccion || '—'} full />
            <DL label="Registrado" value={fmt.date(cliente.CreatedAt)} />
            <DL label="Último login" value={fmt.dateTime(cliente.LastLoginAt)} />
          </div>
        )}
      </div>

      {/* Financiamientos */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Financiamientos ({fins.length})</h2>
          <button
            style={s.btnPri}
            onClick={() => navigate(`/financiamientos/nuevo?cliente_id=${id}`)}
          >
            + Nuevo financiamiento
          </button>
        </div>

        {fins.length === 0 ? (
          <p style={{ color: '#718096', fontSize: 14 }}>Sin financiamientos registrados.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Producto','Inicio','Vencimiento','Total','Pagado','Saldo','Status',''].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fins.map((f) => (
                <tr key={f.FinanciamientoId}
                  style={s.tr}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={(e)  => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={s.td}>{f.NombreProducto}</td>
                  <td style={s.td}>{fmt.date(f.FechaInicio)}</td>
                  <td style={s.td}>{fmt.date(f.FechaVencimiento)}</td>
                  <td style={s.td}>{fmt.money(f.MontoTotalPagar)}</td>
                  <td style={{ ...s.td, color: '#38a169', fontWeight: 600 }}>{fmt.money(f.TotalPagado)}</td>
                  <td style={{ ...s.td, color: f.SaldoPendiente > 0 ? '#e53e3e' : '#38a169', fontWeight: 600 }}>
                    {fmt.money(f.SaldoPendiente)}
                  </td>
                  <td style={s.td}>{statusBadge(f.Status)}</td>
                  <td style={s.td}>
                    <button
                      style={s.btnLink}
                      onClick={() => navigate(`/financiamientos/${f.FinanciamientoId}`)}
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
function DL({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={s.dlLabel}>{label}</div>
      <div style={s.dlValue}>{value}</div>
    </div>
  );
}

const s = {
  header:    { marginBottom: 24 },
  back:      { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  titleRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  title:     { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a2035' },
  card:      { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  cardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#2d3748' },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 20px' },
  label:     { display: 'block', fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 4 },
  input:     { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  dlLabel:   { fontSize: 12, color: '#718096', fontWeight: 600, marginBottom: 2 },
  dlValue:   { fontSize: 14, color: '#2d3748' },
  actions:   { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  btnPri:    { padding: '9px 18px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSec:    { padding: '9px 18px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnLink:   { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '10px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:        { padding: '11px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  tr:        { transition: 'background 0.1s' },
};
