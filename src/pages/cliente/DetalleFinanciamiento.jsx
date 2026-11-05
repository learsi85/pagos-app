import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';
import toast from 'react-hot-toast';
import { descargarPdf, descargarExcel } from '@/utils/downloadBlob';

export default function DetalleFinanciamiento() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [fin,     setFin]     = useState(null);
  const [plan,    setPlan]    = useState([]);
  const [pagos,   setPagos]   = useState([]);
  const [tab,     setTab]     = useState('plan');
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
  const [solicitudes, setSolicitudes] = useState([]);
  const [modalPago,   setModalPago]   = useState(false);
  const [metodos,     setMetodos]     = useState([]);
  const [archivo,     setArchivo]     = useState(null);
  const [enviando,    setEnviando]    = useState(false);
  const [form, setForm] = useState({ monto: '', fecha_pago: hoy, metodo_pago_id: '', referencia: '', notas: '' });
  
  const proxima = plan.find(p => ['PENDIENTE','PARCIAL','VENCIDO'].includes(p.Status));

  useEffect(() => {
    Promise.all([portalApi.financiamiento(id), portalApi.plan(id), portalApi.pagos(id), portalApi.solicitudesPago(id)])
      .then(([rf, rp, rpg, rs]) => { setFin(rf.data); setPlan(rp.data); setPagos(rpg.data); setSolicitudes(rs.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const abrirModalPago = async () => {
    setModalPago(true);
    setForm(f => ({ ...f, monto: f.monto || (proxima ? String(proxima.TotalAPagar) : '') }));
    if (metodos.length === 0) {
      try { const r = await portalApi.metodosPago(); setMetodos(r.data); }
      catch { toast.error('No se pudieron cargar los métodos de pago'); }
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (!(parseFloat(form.monto) > 0)) return toast.error('Ingresa el monto que pagaste');
    if (!form.metodo_pago_id)          return toast.error('Selecciona el método de pago');
    if (!archivo)                      return toast.error('Adjunta tu comprobante');
    setEnviando(true);
    try {
      await portalApi.crearSolicitudPago(id, { ...form, comprobante: archivo });
      toast.success('Comprobante enviado. Tu pago se registrará cuando sea autorizado.');
      setModalPago(false); setArchivo(null);
      setForm({ monto: '', fecha_pago: hoy, metodo_pago_id: '', referencia: '', notas: '' });
      const r = await portalApi.solicitudesPago(id);
      setSolicitudes(r.data); setTab('solicitudes');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar el comprobante');
    } finally { setEnviando(false); }
  };

  if (loading) return <p style={{ color: '#888' }}>Cargando…</p>;
  if (!fin)    return <p style={{ color: '#e53e3e' }}>No encontrado</p>;

  const pct = fin.MontoTotalPagar > 0 ? Math.min(100, (fin.TotalPagado / fin.MontoTotalPagar) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <button style={s.back} onClick={() => navigate('/portal/financiamientos')}>← Mis financiamientos</button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2035' }}>{fin.NombreProducto}</h1>
          {statusBadge(fin.Status)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => descargarPdf(() => portalApi.estadoCuentaPdf(id), `estado-cuenta-${id}.pdf`).catch(() => toast.error('No se pudo generar el PDF'))}
            style={{ padding: '8px 16px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📄 PDF
          </button>
          <button
            onClick={() => descargarExcel(() => portalApi.estadoCuentaExcel(id), `estado-cuenta-${id}.xlsx`).catch(() => toast.error('No se pudo generar el Excel'))}
            style={{ padding: '8px 16px', background: '#216e39', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📊 Excel
          </button>
          {['ACTIVO','VENCIDO'].includes(fin.Status) && (
            <button onClick={abrirModalPago}
              style={{ padding: '8px 16px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              💸 Reportar pago
            </button>
          )}
        </div>
      </div>
      <p style={{ color: '#718096', fontSize: 13, margin: '0 0 20px' }}>{fin.Empresa}</p>

      {/* Progreso */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>Progreso de pago</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#3182ce' }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={s.bar}><div style={{ ...s.barFill, width: `${pct}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096', marginTop: 6 }}>
          <span>Inicio: {fmt.date(fin.FechaInicio)}</span>
          <span>Vencimiento: {fmt.date(fin.FechaVencimiento)}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        {[
          { label: 'Total a pagar',   value: fmt.money(fin.MontoTotalPagar), color: '#2b6cb0' },
          { label: 'Total pagado',    value: fmt.money(fin.TotalPagado),     color: '#38a169' },
          { label: 'Saldo pendiente', value: fmt.money(fin.SaldoPendiente),  color: +fin.SaldoPendiente > 0 ? '#e53e3e' : '#38a169' },
          { label: 'Por pago',        value: `${fin.NumeroPagos} × ${fmt.money(fin.MontoPorPago)}`, color: '#6b46c1' },
          (proxima ? [{
            label: `Próximo pago · cuota ${proxima.NumeroPago}${proxima.MoraPendiente > 0 ? ' (incluye mora)' : ''}`,
            value: fmt.money(proxima.TotalAPagar),
            color: '#d69e2e',
          }] : []),
        ].map((k, i) => (
          <div key={i} style={{ ...s.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: k.color, wordBreak: 'break-word' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {[['plan','Plan de pagos'],['pagos','Historial de pagos'],['solicitudes',`Mis solicitudes${solicitudes.some(x => x.Status==='PENDIENTE') ? ' •' : ''}`]].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 20px', border: 'none', background: 'none', fontSize: 14, cursor: 'pointer', fontWeight: tab === t ? 700 : 400, color: tab === t ? '#1a2035' : '#718096', borderBottom: tab === t ? '2px solid #1a2035' : '2px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead><tr>{['#','Vencimiento','Monto','Pagado','Saldo','Mora','Total a pagar','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {plan.map(p => (
                  <tr key={p.PlanPagoId} style={{ background: p.Status === 'VENCIDO' ? '#fff5f5' : 'transparent' }}>
                    <td style={s.td}>{p.NumeroPago}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(p.FechaVencimiento)}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.money(p.MontoEsperado)}</td>
                    <td style={{ ...s.td, color: '#38a169', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt.money(p.MontoPagado)}</td>
                    <td style={{ ...s.td, fontWeight: 600, whiteSpace: 'nowrap', color: +p.SaldoPendiente > 0 ? '#e53e3e' : '#38a169' }}>{fmt.money(p.SaldoPendiente)}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      {p.MoraPendiente > 0 ? (
                        <span style={{ color: '#e53e3e', fontWeight: 600 }}>
                          {fmt.money(p.MoraPendiente)}
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#a0aec0' }}>
                            {p.DiasRetraso} día{p.DiasRetraso !== 1 ? 's' : ''} de atraso
                          </span>
                        </span>
                      ) : <span style={{ color: '#a0aec0' }}>—</span>}
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap', fontWeight: 700, color: '#1a2035' }}>
                      {p.TotalAPagar > 0 ? fmt.money(p.TotalAPagar) : '—'}
                    </td>
                    <td style={s.td}>{statusBadge(p.Status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pagos' && (
        <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          {pagos.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>Sin pagos registrados</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                <thead><tr>{['Fecha','Monto','Método','Referencia'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {pagos.map(p => (
                    <tr key={p.PagoId}>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(p.FechaPago)}</td>
                      <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0', whiteSpace: 'nowrap' }}>{fmt.money(p.Monto)}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{p.MetodoPago}</td>
                      <td style={{ ...s.td, color: '#718096' }}>{p.Referencia || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab === 'solicitudes' && (
        <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          {solicitudes.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>No has reportado pagos</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                <thead><tr>{['Enviado','Monto','Fecha de pago','Método','Estatus'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {solicitudes.map(x => (
                    <tr key={x.SolicitudPagoId}>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(x.CreatedAt)}</td>
                      <td style={{ ...s.td, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt.money(x.Monto)}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(x.FechaPago)}</td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{x.MetodoPago}</td>
                      <td style={s.td}>
                        {x.Status === 'PENDIENTE' && <span style={{ color: '#975a16', fontWeight: 600 }}>En revisión</span>}
                        {x.Status === 'APROBADO'  && <span style={{ color: '#276749', fontWeight: 600 }}>Aprobado</span>}
                        {x.Status === 'RECHAZADO' && (
                          <span style={{ color: '#c53030', fontWeight: 600 }}>
                            Rechazado{x.MotivoRechazo ? <span style={{ display: 'block', fontWeight: 400, fontSize: 12 }}>{x.MotivoRechazo}</span> : null}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {modalPago && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={(e) => e.target === e.currentTarget && setModalPago(false)}>
          <form onSubmit={enviarSolicitud} style={{ background:'#fff', borderRadius:12, padding:'24px', width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:700, color:'#1a2035' }}>Reportar pago</h3>
            <p style={{ margin:'0 0 16px', fontSize:13, color:'#718096' }}>Tu pago se registrará cuando sea revisado y autorizado.</p>
            {proxima && (
              <div style={{ background:'#ebf8ff', border:'1px solid #bee3f8', borderRadius:8, padding:'10px 12px', marginBottom:14, fontSize:13, color:'#2c5282' }}>
                <strong>Cuota #{proxima.NumeroPago}</strong>: saldo {fmt.money(proxima.SaldoPendiente)}
                {proxima.MoraPendiente > 0 && <> + mora {fmt.money(proxima.MoraPendiente)} ({proxima.DiasRetraso} día{proxima.DiasRetraso !== 1 ? 's' : ''} de atraso)</>}
                {' '}= <strong>{fmt.money(proxima.TotalAPagar)}</strong>
              </div>
            )}
            {[['monto','Monto pagado *','number'],['fecha_pago','Fecha del pago *','date'],['referencia','Referencia / folio','text']].map(([k,label,type]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:4 }}>{label}</label>
                <input type={type} value={form[k]} step={type==='number' ? '0.01' : undefined} min={type==='number' ? '0' : undefined}
                  max={k==='fecha_pago' ? hoy : undefined}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:4 }}>Método de pago *</label>
              <select value={form.metodo_pago_id} onChange={(e) => setForm({ ...form, metodo_pago_id: e.target.value })}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, boxSizing:'border-box', fontFamily:'inherit' }}>
                <option value="">Selecciona…</option>
                {metodos.map(m => <option key={m.MetodoPagoId} value={m.MetodoPagoId}>{m.Nombre}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:4 }}>Comprobante * (JPG, PNG o PDF)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setArchivo(e.target.files?.[0] || null)} style={{ fontSize:13 }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:4 }}>Notas</label>
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
                style={{ width:'100%', minHeight:56, padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" onClick={() => setModalPago(false)} style={{ padding:'9px 18px', background:'#fff', color:'#4a5568', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button type="submit" disabled={enviando} style={{ padding:'9px 18px', background:'#3182ce', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>{enviando ? 'Enviando…' : 'Enviar comprobante'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const s = {
  back:    { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 12 },
  card:    { background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 16 },
  kpiCard: { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' },
  bar:     { height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 4, transition: 'width .4s' },
  th:      { padding: '10px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa', whiteSpace: 'nowrap' },
  td:      { padding: '10px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
};
