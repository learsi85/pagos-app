import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { financiamientosApi, pagosApi, metodosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const schema = z.object({
  metodo_pago_id: z.coerce.number().positive('Selecciona un método'),
  monto:          z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha_pago:     z.string().min(1, 'Requerido'),
  plan_pago_id:   z.coerce.number().optional(),
  referencia:     z.string().optional(),
  notas:          z.string().optional(),
});

export default function RegistrarPago() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [fin,      setFin]      = useState(null);
  const [plan,     setPlan]     = useState([]);
  const [metodos,  setMetodos]  = useState([]);
  const [archivo,  setArchivo]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fecha_pago: new Date().toISOString().slice(0, 10) },
  });

  const planPagoId = watch('plan_pago_id');

  useEffect(() => {
    Promise.all([
      financiamientosApi.get(id),
      financiamientosApi.plan(id),
      metodosApi.list(),
    ]).then(([rf, rp, rm]) => {
      setFin(rf.data);
      setPlan(rp.data.filter((p) => ['PENDIENTE','PARCIAL'].includes(p.Status)));
      setMetodos(rm.data);
    }).finally(() => setLoading(false));
  }, [id]);

  // Al seleccionar una cuota → pre-rellenar monto
  useEffect(() => {
    if (!planPagoId) return;
    const cuota = plan.find((p) => p.PlanPagoId === +planPagoId);
    if (cuota) setValue('monto', cuota.SaldoPendiente);
  }, [planPagoId, plan]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, financiamiento_id: id };
      if (archivo) payload.comprobante = archivo;
      await pagosApi.create(payload);
      toast.success('Pago registrado exitosamente');
      navigate(`/financiamientos/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Wrap><p style={{ color: '#888' }}>Cargando…</p></Wrap>;
  if (!fin)    return <Wrap><p style={{ color: '#e53e3e' }}>No encontrado</p></Wrap>;

  return (
    <Wrap>
      <button style={s.back} onClick={() => navigate(`/financiamientos/${id}`)}>
        ← Financiamiento #{id}
      </button>
      <h1 style={s.title}>Registrar pago</h1>

      <div style={s.layout}>
        {/* Formulario */}
        <div style={s.formCard}>
          <form onSubmit={handleSubmit(onSubmit)}>

            <Section title="Aplicar a cuota (opcional)">
              <p style={s.hint}>
                Si seleccionas una cuota específica se actualizará su saldo. Si no, es un abono libre.
              </p>
              {plan.length === 0 ? (
                <p style={{ color: '#718096', fontSize: 13 }}>No hay cuotas pendientes</p>
              ) : (
                <div style={s.cuotaList}>
                  {/* Opción "abono libre" */}
                  <label style={s.cuotaRow}>
                    <input type="radio" {...register('plan_pago_id')} value="" style={{ marginRight: 8 }} />
                    <span style={{ fontSize: 13, color: '#4a5568' }}>Abono libre (sin cuota específica)</span>
                  </label>
                  {plan.map((p) => (
                    <label key={p.PlanPagoId} style={s.cuotaRow}>
                      <input
                        type="radio"
                        {...register('plan_pago_id')}
                        value={p.PlanPagoId}
                        style={{ marginRight: 8 }}
                      />
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Cuota #{p.NumeroPago}</span>
                          <span style={{ fontSize: 12, color: '#718096', marginLeft: 8 }}>
                            Vence: {fmt.date(p.FechaVencimiento)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {statusBadge(p.Status)}
                          <div style={{ fontSize: 12, color: '#e53e3e', fontWeight: 600, marginTop: 2 }}>
                            Saldo: {fmt.money(p.SaldoPendiente)}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Datos del pago">
              <div style={s.twoCol}>
                <F label="Monto (MXN) *" error={errors.monto?.message}>
                  <input {...register('monto')} type="number" step="0.01" min="0.01" style={s.input} />
                </F>
                <F label="Fecha de pago *" error={errors.fecha_pago?.message}>
                  <input {...register('fecha_pago')} type="date" style={s.input} />
                </F>
              </div>

              <F label="Método de pago *" error={errors.metodo_pago_id?.message}>
                <select {...register('metodo_pago_id')} style={s.input}>
                  <option value="">— Selecciona —</option>
                  {metodos.map((m) => (
                    <option key={m.MetodoPagoId} value={m.MetodoPagoId}>{m.Nombre}</option>
                  ))}
                </select>
              </F>

              <F label="Referencia / Folio" error={errors.referencia?.message}>
                <input {...register('referencia')} placeholder="Núm. transferencia, folio, etc." style={s.input} />
              </F>

              <F label="Comprobante de pago (opcional)">
                <div style={s.fileZone}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    id="comprobante"
                    style={{ display: 'none' }}
                    onChange={(e) => setArchivo(e.target.files[0] || null)}
                  />
                  <label htmlFor="comprobante" style={s.fileLabel}>
                    {archivo ? `📎 ${archivo.name}` : '📎 Seleccionar archivo (JPG, PNG o PDF, máx 5 MB)'}
                  </label>
                  {archivo && (
                    <button type="button" style={s.removeFile} onClick={() => setArchivo(null)}>✕</button>
                  )}
                </div>
              </F>

              <F label="Notas" error={errors.notas?.message}>
                <textarea {...register('notas')} style={{ ...s.input, minHeight: 70, resize: 'vertical' }} />
              </F>
            </Section>

            <div style={s.formActions}>
              <button type="button" style={s.btnSec} onClick={() => navigate(`/financiamientos/${id}`)}>
                Cancelar
              </button>
              <button type="submit" style={s.btnPri} disabled={saving}>
                {saving ? 'Guardando…' : '💰 Registrar pago'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumen del financiamiento */}
        <div style={s.sidebar}>
          <div style={s.sideCard}>
            <h3 style={s.cardTitle}>Resumen del financiamiento</h3>
            <RI label="Cliente"       value={`${fin.ApellidoPaterno}, ${fin.Nombre}`} />
            <RI label="Producto"      value={fin.NombreProducto} />
            <RI label="Total a pagar" value={fmt.money(fin.MontoTotalPagar)} />
            <RI label="Total pagado"  value={fmt.money(fin.TotalPagado)}  color="#38a169" />
            <RI label="Saldo pendiente" value={fmt.money(fin.SaldoPendiente)} color="#e53e3e" bold />
          </div>
        </div>
      </div>
    </Wrap>
  );
}

function Wrap({ children }) {
  return <div style={{ padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  );
}
function F({ label, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errMsg}>{error}</p>}
    </div>
  );
}
function RI({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 13, color: '#718096' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color: color || '#2d3748' }}>{value}</span>
    </div>
  );
}

const s = {
  back:       { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  title:      { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a2035' },
  layout:     { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' },
  formCard:   { background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  sidebar:    { display: 'flex', flexDirection: 'column', gap: 16 },
  sideCard:   { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle:  { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  twoCol:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input:      { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  label:      { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  errMsg:     { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  hint:       { margin: '0 0 10px', fontSize: 12, color: '#718096' },
  cuotaList:  { display: 'flex', flexDirection: 'column', gap: 6, background: '#f7fafc', borderRadius: 8, padding: 12 },
  cuotaRow:   { display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', transition: 'border-color 0.15s' },
  fileZone:   { display: 'flex', alignItems: 'center', gap: 8 },
  fileLabel:  { flex: 1, padding: '9px 12px', border: '1px dashed #cbd5e0', borderRadius: 8, fontSize: 12, color: '#4a5568', cursor: 'pointer', background: '#f7fafc' },
  removeFile: { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 16 },
  formActions:{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' },
  btnPri:     { padding: '10px 24px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSec:     { padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};
