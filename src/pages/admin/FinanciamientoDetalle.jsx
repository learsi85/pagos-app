import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { financiamientosApi, pagosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';
const uploadsBase = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';

export default function FinanciamientoDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [fin,     setFin]     = useState(null);
  const [plan,    setPlan]    = useState([]);
  const [pagos,   setPagos]   = useState([]);
  const [cargos,  setCargos]  = useState([]);
  const [tab,     setTab]     = useState('plan');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rf, rp, rpg, rc] = await Promise.all([
        financiamientosApi.get(id),
        financiamientosApi.plan(id),
        financiamientosApi.pagos(id),
        financiamientosApi.cargos(id),
      ]);
      setFin(rf.data);
      setPlan(rp.data);
      setPagos(rpg.data);
      setCargos(rc.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Wrap><p style={{ color: '#888' }}>Cargando…</p></Wrap>;
  if (!fin)    return <Wrap><p style={{ color: '#e53e3e' }}>No encontrado</p></Wrap>;

  const pctPagado = fin.MontoTotalPagar > 0
    ? Math.min(100, (fin.TotalPagado / fin.MontoTotalPagar) * 100)
    : 0;

  const totalMoratorio = cargos
    .filter((c) => c.Status === 'APLICADO')
    .reduce((sum, c) => sum + parseFloat(c.MontoAplicado || 0), 0);

  return (
    <Wrap>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/financiamientos')}>← Financiamientos</button>
        <div style={s.titleRow}>
          <h1 style={s.title}>Financiamiento #{fin.FinanciamientoId} — {fin.NombreProducto}</h1>
          {statusBadge(fin.Status)}
        </div>
        <p style={s.sub}>
          Cliente:{' '}
          <button style={s.clienteLink} onClick={() => navigate(`/clientes/${fin.ClienteId}`)}>
            {fin.ApellidoPaterno}, {fin.Nombre}
          </button>
          {' '}· {fin.Email}
        </p>
      </div>

      {/* KPIs */}
      <div style={s.kpiRow}>
        <KpiBox label="Total a pagar"    value={fmt.money(fin.MontoTotalPagar)} color="#2b6cb0" />
        <KpiBox label="Total pagado"     value={fmt.money(fin.TotalPagado)}     color="#38a169" />
        <KpiBox label="Saldo pendiente"  value={fmt.money(fin.SaldoPendiente)}
          color={+fin.SaldoPendiente > 0 ? '#e53e3e' : '#38a169'} />
        <KpiBox label="Por pago"
          value={`${fin.NumeroPagos} × ${fmt.money(fin.MontoPorPago)}`} color="#6b46c1" />
        {totalMoratorio > 0 && (
          <KpiBox label="Mora cobrada" value={fmt.money(totalMoratorio)} color="#c05621" />
        )}
      </div>

      {/* Barra de progreso */}
      <div style={s.progressCard}>
        <div style={s.progressLabel}>
          <span>Progreso de pago</span>
          <span style={{ fontWeight: 700 }}>{pctPagado.toFixed(1)}%</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${pctPagado}%` }} />
        </div>
        <div style={s.progressDates}>
          <span>Inicio: {fmt.date(fin.FechaInicio)}</span>
          <span>Vencimiento: {fmt.date(fin.FechaVencimiento)}</span>
        </div>
      </div>

      {/* Condiciones */}
      <div style={s.detailCard}>
        <h3 style={s.cardTitle}>Condiciones del financiamiento</h3>
        <div style={s.detailGrid}>
          <DL label="Precio producto"   value={fmt.money(fin.PrecioProducto)} />
          <DL label="Enganche"          value={fmt.money(fin.Enganche)} />
          <DL label="Monto financiado"  value={fmt.money(fin.MontoFinanciado)} />
          <DL label="Tipo de interés"   value={fin.TipoInteres} />
          {fin.TipoInteres !== 'NINGUNO' && (
            <DL label="Interés total"   value={fmt.money(fin.MontoInteres)} />
          )}
          <DL label="Frecuencia"        value={fin.FrecuenciaPago} />
          <DL label="Excedente"
            value={fin.ExcedenteDestino === 'ABONO_CAPITAL' ? 'Abono a capital' : 'Siguiente cuota'} />
          {fin.MoratorioActivo ? (
            <DL label="Moratorio"
              value={fin.MoratorioTipo === 'MONTO_FIJO'
                ? `${fmt.money(fin.MoratorioValor)} fijo`
                : `${fin.MoratorioValor}% sobre ${fin.MoratorioBase === 'CUOTA' ? 'cuota' : 'saldo total'}`
              } />
          ) : (
            <DL label="Moratorio" value="No aplica" />
          )}
          {fin.Notas && <DL label="Notas" value={fin.Notas} full />}
        </div>
      </div>

      {/* Acción registrar pago */}
      {fin.Status === 'ACTIVO' && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={s.btnPri} onClick={() => navigate(`/financiamientos/${id}/pago`)}>
            💰 Registrar pago
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        <Tab active={tab === 'plan'}   onClick={() => setTab('plan')}>Plan de pagos</Tab>
        <Tab active={tab === 'pagos'}  onClick={() => setTab('pagos')}>
          Historial de pagos
        </Tab>
        {cargos.length > 0 && (
          <Tab active={tab === 'cargos'} onClick={() => setTab('cargos')}>
            Cargos por mora {cargos.length > 0 && `(${cargos.length})`}
          </Tab>
        )}
      </div>

      {/* ── Tab: Plan de pagos ── */}
      {tab === 'plan' && (
        <div style={s.tableCard}>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#','Vencimiento','Esperado','Pagado','Saldo','Status'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.PlanPagoId}
                    style={{ background: p.Status === 'VENCIDO' ? '#fff5f5' : 'transparent' }}
                  >
                    <td style={s.td}>{p.NumeroPago}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(p.FechaVencimiento)}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.money(p.MontoEsperado)}</td>
                    <td style={{ ...s.td, color: '#38a169', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {fmt.money(p.MontoPagado)}
                    </td>
                    <td style={{
                      ...s.td, fontWeight: 600, whiteSpace: 'nowrap',
                      color: +p.SaldoPendiente > 0 ? '#e53e3e' : '#38a169',
                    }}>
                      {fmt.money(p.SaldoPendiente)}
                    </td>
                    <td style={s.td}>{statusBadge(p.Status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Historial de pagos (con moratorio) ── */}
      {tab === 'pagos' && (
        <div style={s.tableCard}>
          {pagos.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>
              Sin pagos registrados
            </p>
          ) : (
            <div style={s.tableScroll}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Fecha','Monto cobrado','Recargo mora','Método','Referencia','Comprobante'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const mora  = parseFloat(p.MoratorioAplicado || 0);
                    //const total = parseFloat(p.Monto) + mora;
                    return (
                      <tr key={p.PagoId}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(p.FechaPago)}</td>
                        <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0', whiteSpace: 'nowrap' }}>
                          {fmt.money(p.Monto)}
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                          {mora > 0
                            ? <span style={{ color: '#e53e3e', fontWeight: 600 }}>{fmt.money(mora)}</span>
                            : <span style={{ color: '#a0aec0' }}>—</span>
                          }
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{p.MetodoPago}</td>
                        <td style={{ ...s.td, color: '#718096', whiteSpace: 'nowrap' }}>
                          {p.Referencia || '—'}
                        </td>
                        <td style={s.td}>
                          {p.ComprobanteUrl
                            ? <a href={`${uploadsBase}/${p.ComprobanteUrl}`} target="_blank"
                                rel="noreferrer" style={{ color: '#3182ce', fontSize: 13 }}>Ver</a>
                            : '—'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Cargos por mora ── */}
      {tab === 'cargos' && (
        <div style={s.tableCard}>
          {cargos.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>
              Sin cargos por mora
            </p>
          ) : (
            <>
              {/* Resumen de mora total */}
              <div style={s.moratorioResumen}>
                <span style={{ fontSize: 14, color: '#c05621', fontWeight: 700 }}>
                  Total mora cobrada: {fmt.money(totalMoratorio)}
                </span>
              </div>
              <div style={s.tableScroll}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['Cuota #','Vencimiento','Días retraso','Calculado','Cobrado','Aplicado','Status'].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cargos.map((c) => (
                      <tr key={c.CargoId}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={s.td}>#{c.NumeroPago}</td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(c.FechaVencimiento)}</td>
                        <td style={{ ...s.td, color: '#e53e3e', fontWeight: 600 }}>
                          {c.DiasRetraso} días
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.money(c.MontoCalculado)}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: '#e53e3e', whiteSpace: 'nowrap' }}>
                          {fmt.money(c.MontoAplicado)}
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(c.AplicadoAt)}</td>
                        <td style={s.td}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                            fontSize: 11, fontWeight: 600,
                            background: c.Status === 'APLICADO' ? '#f0fff4' : '#fff5f5',
                            color: c.Status === 'APLICADO' ? '#38a169' : '#e53e3e',
                          }}>
                            {c.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </Wrap>
  );
}

function Wrap({ children }) {
  return <div style={{ padding: '24px 20px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}
function KpiBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}`, minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color, wordBreak: 'break-word' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{label}</div>
    </div>
  );
}
function DL({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#2d3748' }}>{value}</div>
    </div>
  );
}
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 20px', border: 'none', background: 'none',
      fontSize: 14, cursor: 'pointer', fontWeight: active ? 700 : 400,
      color: active ? '#1a2035' : '#718096',
      borderBottom: active ? '2px solid #1a2035' : '2px solid transparent',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

const s = {
  header:          { marginBottom: 20 },
  back:            { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  titleRow:        { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  title:           { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a2035' },
  sub:             { margin: '6px 0 0', fontSize: 13, color: '#718096' },
  clienteLink:     { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0 },
  kpiRow:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 16 },
  progressCard:    { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  progressLabel:   { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4a5568', marginBottom: 8 },
  progressBar:     { height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' },
  progressFill:    { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 6, transition: 'width 0.4s ease' },
  progressDates:   { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096', marginTop: 6 },
  detailCard:      { background: '#fff', borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  cardTitle:       { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  detailGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '12px 20px' },
  btnPri:          { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  tabs:            { display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' },
  tableCard:       { background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableScroll:     { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 },
  th:              { padding: '10px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa', whiteSpace: 'nowrap' },
  td:              { padding: '10px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  moratorioResumen:{ padding: '12px 16px', background: '#fff5f5', borderBottom: '1px solid #fed7d7' },
};
