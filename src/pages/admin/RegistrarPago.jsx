import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { financiamientosApi, pagosApi, metodosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const schema = z.object({
  metodo_pago_id:             z.coerce.number().positive('Selecciona un método'),
  monto_recibido:             z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha_pago:                 z.string().min(1, 'Requerido'),
  plan_pago_id:               z.string().optional(),
  referencia:                 z.string().optional(),
  notas:                      z.string().optional(),
  aplicar_moratorio:          z.boolean().default(false),
  monto_moratorio:            z.coerce.number().min(0).default(0),
  notas_moratorio:            z.string().optional(),
  excedente_destino_override: z.string().optional(),
});

export default function RegistrarPago() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [fin,         setFin]         = useState(null);
  const [plan,        setPlan]        = useState([]);
  const [metodos,     setMetodos]     = useState([]);
  const [archivo,     setArchivo]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [moratorio,   setMoratorio]   = useState(null);
  const [calMor,      setCalMor]      = useState(false);
  const [cuotaActual, setCuotaActual] = useState(null);

  const { register, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_pago:        new Date().toISOString().slice(0, 10),
      aplicar_moratorio: false,
      monto_moratorio:   0,
      monto_recibido:    0,
    },
  });

  const planPagoId    = watch('plan_pago_id');
  const fechaPago     = watch('fecha_pago');
  const aplicarMor    = watch('aplicar_moratorio');
  const montoMor      = watch('monto_moratorio');
  const montoRecibido = watch('monto_recibido');

  useEffect(() => {
    Promise.all([
      financiamientosApi.get(id),
      financiamientosApi.plan(id),
      metodosApi.list(),
    ]).then(([rf, rp, rm]) => {
      setFin(rf.data);
      const pendientes = rp.data.filter(p => ['PENDIENTE','PARCIAL','VENCIDO'].includes(p.Status));
      setPlan(pendientes);
      if (pendientes.length > 0) {
        const primera = pendientes[0];
        setCuotaActual(primera);
        setValue('plan_pago_id', String(primera.PlanPagoId));
        // El monto recibido inicial = saldo de la cuota (sin mora aún)
        setValue('monto_recibido', Number(primera.SaldoPendiente));
      }
      setMetodos(rm.data);
    }).finally(() => setLoading(false));
  }, [id]);

  // Calcular moratorio cuando cambia cuota o fecha
  useEffect(() => {
    if (!planPagoId || !fin?.MoratorioActivo) { setMoratorio(null); return; }

    const cuota = plan.find(p => String(p.PlanPagoId) === String(planPagoId));
    if (cuota) setCuotaActual(cuota);

    setCalMor(true);
    financiamientosApi.calcularMoratorio(id, planPagoId, { fecha_pago: fechaPago })
      .then(r => {
        setMoratorio(r.data);
        if (r.data.monto > 0) {
          setValue('monto_moratorio', r.data.monto);
        } else {
          setValue('monto_moratorio', 0);
          setValue('aplicar_moratorio', false);
        }
      })
      .catch(() => setMoratorio(null))
      .finally(() => setCalMor(false));
  }, [planPagoId, fechaPago, fin]);

  // Cuando se activa/desactiva mora: ajustar monto_recibido sugerido
  useEffect(() => {
    if (!cuotaActual) return;
    const saldo = parseFloat(cuotaActual.SaldoPendiente) || 0;
    const mora  = aplicarMor ? (parseFloat(montoMor) || 0) : 0;
    setValue('monto_recibido', round2(saldo + mora));
  }, [aplicarMor, montoMor]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const montoRecib = parseFloat(data.monto_recibido) || 0;
      const moraCobrada = data.aplicar_moratorio
        ? (parseFloat(data.monto_moratorio) || 0)
        : 0;

      // El monto que se aplica a la cuota = total recibido - mora
      // Si no hay mora, todo va a la cuota
      //const montoACuota = round2(Math.max(0, montoRecib - moraCobrada));

      const payload = {
        financiamiento_id:          id,
        plan_pago_id:               data.plan_pago_id,
        metodo_pago_id:             data.metodo_pago_id,
        // El backend recibe el monto que va a la cuota (sin mora)
        monto:                      montoRecib,
        fecha_pago:                 data.fecha_pago,
        referencia:                 data.referencia,
        notas:                      data.notas,
        // Mora
        aplicar_moratorio:          data.aplicar_moratorio ? '1' : '0',
        monto_moratorio:            moraCobrada,
        monto_moratorio_calculado:  moratorio?.monto ?? moraCobrada,
        dias_retraso:               moratorio?.dias_retraso ?? 0,
        notas_moratorio:            data.notas_moratorio,
        // Excedente
        excedente_destino_override: data.excedente_destino_override,
        comprobante:                archivo || undefined,
      };

      const r = await pagosApi.create(payload);

      const exc = parseFloat(r.data.excedente_aplicado || 0);
      if (exc > 0) {
        const destino = data.excedente_destino_override || fin?.ExcedenteDestino || 'SIGUIENTE_CUOTA';
        toast.success(`Pago registrado. Excedente de ${fmt.money(exc)} → ${destino === 'ABONO_CAPITAL' ? 'capital' : 'siguiente cuota'}.`);
      } else {
        toast.success('Pago registrado exitosamente');
      }
      navigate(`/financiamientos/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Wrap><p style={{ color: '#888' }}>Cargando…</p></Wrap>;
  if (!fin)    return <Wrap><p style={{ color: '#e53e3e' }}>No encontrado</p></Wrap>;

  // Distribución del monto recibido
  const recib      = parseFloat(montoRecibido) || 0;
  const moraCobr   = aplicarMor ? (parseFloat(montoMor) || 0) : 0;
  const aCuota     = round2(Math.max(0, recib - moraCobr));
  const saldoCuota = parseFloat(cuotaActual?.SaldoPendiente || 0);
  const excedente  = aCuota > saldoCuota ? round2(aCuota - saldoCuota) : 0;

  return (
    <Wrap>
      <button style={s.back} onClick={() => navigate(`/financiamientos/${id}`)}>
        ← Financiamiento #{id}
      </button>
      <h1 style={s.title}>Registrar pago</h1>

      <div style={s.layout}>
        <div style={s.formCard}>
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Cuota */}
            <Section title="Cuota a pagar">
              {cuotaActual ? (
                <div style={s.cuotaCard}>
                  <div style={s.cuotaHeader}>
                    <div>
                      <div style={s.cuotaTitulo}>Cuota #{cuotaActual.NumeroPago}</div>
                      <div style={s.cuotaFecha}>Vence: {fmt.date(cuotaActual.FechaVencimiento)}</div>
                    </div>
                    {statusBadge(cuotaActual.Status)}
                  </div>
                  <div style={s.cuotaMonto}>{fmt.money(cuotaActual.SaldoPendiente)}</div>
                </div>
              ) : (
                <p style={{ color: '#718096', fontSize: 13 }}>Sin cuotas pendientes</p>
              )}
            </Section>

            {/* Mora */}
            {fin.MoratorioActivo && planPagoId && (
              <Section title="Recargo por mora">
                {calMor ? (
                  <p style={{ color: '#718096', fontSize: 13 }}>Calculando recargo…</p>
                ) : moratorio && moratorio.dias_retraso > 0 ? (
                  <div style={s.moratorioBox}>
                    <div style={s.moratorioHeader}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#c05621' }}>
                          ⚠ {moratorio.dias_retraso} día{moratorio.dias_retraso !== 1 ? 's' : ''} de atraso
                        </div>
                        <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                          Recargo calculado: <strong style={{ color: '#e53e3e' }}>{fmt.money(moratorio.monto)}</strong>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={aplicarMor}
                          onChange={e => setValue('aplicar_moratorio', e.target.checked)}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>Cobrar recargo</span>
                      </label>
                    </div>
                    {aplicarMor && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #fbd38d' }}>
                        <F label="Monto del recargo (MXN)">
                          <input {...register('monto_moratorio')} type="number" step="0.01" min="0" style={s.input} />
                        </F>
                        <F label="Notas del recargo">
                          <input {...register('notas_moratorio')} style={s.input} placeholder="Opcional" />
                        </F>
                      </div>
                    )}
                  </div>
                ) : moratorio ? (
                  <div style={{ ...s.moratorioBox, background: '#f0fff4', border: '1px solid #9ae6b4' }}>
                    <span style={{ fontSize: 13, color: '#276749' }}>✓ Pago en fecha — sin recargo</span>
                  </div>
                ) : null}
              </Section>
            )}

            {/* Datos del pago */}
            <Section title="Datos del pago">
              {/* Monto recibido — campo principal */}
              <div style={s.montoRecibidoBox}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2035', marginBottom: 6 }}>
                  Monto recibido del cliente (MXN) *
                </label>
                <input
                  {...register('monto_recibido')}
                  type="number" step="0.01" min="0.01"
                  style={{ ...s.input, fontSize: 18, fontWeight: 700, textAlign: 'right', padding: '12px 14px' }}
                />
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#718096' }}>
                  Ingresa el total que el cliente entregó. El sistema distribuirá el monto entre cuota{aplicarMor ? ', recargo' : ''} y excedente.
                </p>
              </div>

              {/* Distribución automática */}
              <div style={s.distribucionBox}>
                <div style={s.distribucionTitle}>Distribución del monto recibido</div>
                <RI label="→ Cuota"               value={fmt.money(saldoCuota)}   color="#2b6cb0" />
                {moraCobr > 0 && (
                  <RI label="→ Recargo por mora"  value={fmt.money(moraCobr)} color="#e53e3e" />
                )}
                {excedente > 0 && (
                  <RI label="→ Excedente"         value={fmt.money(excedente)} color="#6b46c1" />
                )}
                <div style={s.totalFila}>
                  <span>Total</span>
                  <strong>{fmt.money(recib)}</strong>
                </div>
              </div>

              {/* Excedente — destino */}
              {excedente > 0 && (
                <div style={s.excedenteBox}>
                  <div style={{ fontSize: 12, color: '#6b46c1', fontWeight: 700, marginBottom: 6 }}>
                    ⤴ Excedente: {fmt.money(excedente)}
                  </div>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>
                    Default: <strong>{fin.ExcedenteDestino === 'ABONO_CAPITAL' ? 'Abono a capital' : 'Siguiente cuota'}</strong>
                  </div>
                  <select {...register('excedente_destino_override')} style={{ ...s.input, fontSize: 12 }}>
                    <option value="">— Usar default del financiamiento —</option>
                    <option value="SIGUIENTE_CUOTA">Aplicar a siguiente cuota</option>
                    <option value="ABONO_CAPITAL">Abono directo a capital</option>
                  </select>
                </div>
              )}

              <div style={s.twoCol}>
                <F label="Fecha de pago *">
                  <input {...register('fecha_pago')} type="date" style={s.input} />
                </F>
                <F label="Método de pago *">
                  <select {...register('metodo_pago_id')} style={s.input}>
                    <option value="">— Selecciona —</option>
                    {metodos.map(m => <option key={m.MetodoPagoId} value={m.MetodoPagoId}>{m.Nombre}</option>)}
                  </select>
                </F>
              </div>

              <F label="Referencia / Folio">
                <input {...register('referencia')} placeholder="Núm. transferencia, folio, etc." style={s.input} />
              </F>

              <F label="Comprobante (JPG, PNG o PDF, máx 5 MB)">
                <div style={s.fileZone}>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" id="comprobante" style={{ display: 'none' }}
                    onChange={e => setArchivo(e.target.files[0] || null)} />
                  <label htmlFor="comprobante" style={s.fileLabel}>
                    {archivo ? `📎 ${archivo.name}` : '📎 Seleccionar archivo'}
                  </label>
                  {archivo && <button type="button" style={s.removeFile} onClick={() => setArchivo(null)}>✕</button>}
                </div>
              </F>

              <F label="Notas">
                <textarea {...register('notas')} style={{ ...s.input, minHeight: 60, resize: 'vertical' }} />
              </F>
            </Section>

            <div style={s.formActions}>
              <button type="button" style={s.btnSec} onClick={() => navigate(`/financiamientos/${id}`)}>Cancelar</button>
              <button type="submit" style={s.btnPri} disabled={saving}>
                {saving ? 'Guardando…' : '💰 Registrar pago'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sideCard}>
            <h3 style={s.cardTitle}>Financiamiento</h3>
            <RI label="Cliente"         value={`${fin.ApellidoPaterno}, ${fin.Nombre}`} />
            <RI label="Producto"        value={fin.NombreProducto} />
            <RI label="Total a pagar"   value={fmt.money(fin.MontoTotalPagar)} />
            <RI label="Total pagado"    value={fmt.money(fin.TotalPagado)}    color="#38a169" />
            <RI label="Saldo pendiente" value={fmt.money(fin.SaldoPendiente)} color="#e53e3e" bold />
            {fin.MoratorioActivo && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#c05621', fontWeight: 700 }}>
                ⚠ Moratorio: {fin.MoratorioTipo === 'MONTO_FIJO'
                  ? `${fmt.money(fin.MoratorioValor)} fijo`
                  : `${fin.MoratorioValor}% sobre ${fin.MoratorioBase === 'CUOTA' ? 'cuota' : 'saldo total'}`}
              </div>
            )}
          </div>

          {/* Total a cobrar destacado */}
          {recib > 0 && (
            <div style={{ ...s.sideCard, background: '#1a2035' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 4 }}>Total recibido</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{fmt.money(recib)}</div>
              {moraCobr > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 6 }}>
                  Cuota: {fmt.money(aCuota)} · Recargo: {fmt.money(moraCobr)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Wrap>
  );
}

const round2 = n => Math.round(n * 100) / 100;

function Wrap({ children }) {
  return <div style={{ padding: '24px 20px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</h3>
      {children}
    </div>
  );
}
function F({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
function RI({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 13, color: '#718096' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color: color || '#2d3748' }}>{value}</span>
    </div>
  );
}

const s = {
  back:             { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  title:            { margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  layout:           { display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' },
  formCard:         { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  sidebar:          { display: 'flex', flexDirection: 'column', gap: 16 },
  sideCard:         { background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  cardTitle:        { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  twoCol:           { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input:            { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  cuotaCard:        { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, marginBottom: 4 },
  cuotaHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cuotaTitulo:      { fontWeight: 700, fontSize: 15, color: '#1a202c' },
  cuotaFecha:       { fontSize: 13, color: '#718096', marginTop: 4 },
  cuotaMonto:       { textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#2b6cb0' },
  moratorioBox:     { background: '#fffaf0', border: '1px solid #f6ad55', borderRadius: 10, padding: '14px 16px', marginBottom: 4 },
  moratorioHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  montoRecibidoBox: { background: '#ebf8ff', border: '2px solid #3182ce', borderRadius: 10, padding: '16px 18px', marginBottom: 16 },
  distribucionBox:  { background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 12 },
  distribucionTitle:{ fontSize: 12, fontWeight: 700, color: '#4a5568', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' },
  totalFila:        { display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '2px solid #cbd5e0', fontWeight: 700, fontSize: 14, color: '#1a2035' },
  excedenteBox:     { background: '#faf5ff', border: '1px solid #d6bcfa', borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
  fileZone:         { display: 'flex', alignItems: 'center', gap: 8 },
  fileLabel:        { flex: 1, padding: '9px 12px', border: '1px dashed #cbd5e0', borderRadius: 8, fontSize: 12, color: '#4a5568', cursor: 'pointer', background: '#f7fafc' },
  removeFile:       { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 16 },
  formActions:      { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' },
  btnPri:           { padding: '10px 24px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSec:           { padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};