import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { financiamientosApi, pagosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function FinanciamientoDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [fin,     setFin]     = useState(null);
  const [plan,    setPlan]    = useState([]);
  const [pagos,   setPagos]   = useState([]);
  const [tab,     setTab]     = useState('plan');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rf, rp, rpg] = await Promise.all([
        financiamientosApi.get(id),
        financiamientosApi.plan(id),
        financiamientosApi.pagos(id),
      ]);
      setFin(rf.data);
      setPlan(rp.data);
      setPagos(rpg.data);
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

  return (
    <Wrap>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/financiamientos')}>← Financiamientos</button>
        <div style={s.titleRow}>
          <h1 style={s.title}>
            Financiamiento #{fin.FinanciamientoId} — {fin.NombreProducto}
          </h1>
          {statusBadge(fin.Status)}
        </div>
        <p style={s.sub}>
          Cliente:{' '}
          <button
            style={s.clienteLink}
            onClick={() => navigate(`/clientes/${fin.ClienteId}`)}
          >
            {fin.ApellidoPaterno}, {fin.Nombre}
          </button>
          {' '}· {fin.Email}
        </p>
      </div>

      {/* KPIs */}
      <div style={s.kpiRow}>
        <KpiBox label="Total a pagar"    value={fmt.money(fin.MontoTotalPagar)} color="#2b6cb0" />
        <KpiBox label="Total pagado"     value={fmt.money(fin.TotalPagado)}     color="#38a169" />
        <KpiBox label="Saldo pendiente"  value={fmt.money(fin.SaldoPendiente)}  color={+fin.SaldoPendiente > 0 ? '#e53e3e' : '#38a169'} />
        <KpiBox label="Pagos"            value={`${fin.NumeroPagos} × ${fmt.money(fin.MontoPorPago)}`} color="#6b46c1" />
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

      {/* Datos del financiamiento */}
      <div style={s.detailCard}>
        <h3 style={s.cardTitle}>Condiciones del financiamiento</h3>
        <div style={s.detailGrid}>
          <DL label="Precio producto"  value={fmt.money(fin.PrecioProducto)} />
          <DL label="Enganche"         value={fmt.money(fin.Enganche)} />
          <DL label="Monto financiado" value={fmt.money(fin.MontoFinanciado)} />
          <DL label="Tipo de interés"  value={fin.TipoInteres} />
          {fin.TipoInteres !== 'NINGUNO' && (
            <DL label="Valor interés"  value={
              fin.TipoInteres === 'PORCENTAJE'
                ? fmt.pct(fin.ValorInteres)
                : fmt.money(fin.ValorInteres)
            } />
          )}
          <DL label="Interés total"    value={fmt.money(fin.MontoInteres)} />
          <DL label="Frecuencia"       value={fin.FrecuenciaPago} />
          <DL label="Notas"            value={fin.Notas || '—'} full />
        </div>
      </div>

      {/* Acción registrar pago */}
      {fin.Status === 'ACTIVO' && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={s.btnPri}
            onClick={() => navigate(`/financiamientos/${id}/pago`)}
          >
            💰 Registrar pago
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        <Tab active={tab === 'plan'}  onClick={() => setTab('plan')}>Plan de pagos</Tab>
        <Tab active={tab === 'pagos'} onClick={() => setTab('pagos')}>Historial de pagos</Tab>
      </div>

      {tab === 'plan' && (
        <div style={s.tableCard}>
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
                  onMouseEnter={(e) => e.currentTarget.style.background = p.Status === 'VENCIDO' ? '#fff5f5' : '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = p.Status === 'VENCIDO' ? '#fff5f5' : 'transparent'}
                >
                  <td style={s.td}>{p.NumeroPago}</td>
                  <td style={s.td}>{fmt.date(p.FechaVencimiento)}</td>
                  <td style={s.td}>{fmt.money(p.MontoEsperado)}</td>
                  <td style={{ ...s.td, color: '#38a169', fontWeight: 600 }}>{fmt.money(p.MontoPagado)}</td>
                  <td style={{ ...s.td, color: +p.SaldoPendiente > 0 ? '#e53e3e' : '#38a169', fontWeight: 600 }}>
                    {fmt.money(p.SaldoPendiente)}
                  </td>
                  <td style={s.td}>{statusBadge(p.Status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pagos' && (
        <div style={s.tableCard}>
          {pagos.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>
              Sin pagos registrados
            </p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Fecha','Monto','Método','Referencia','Notas','Comprobante'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.PagoId}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={s.td}>{fmt.date(p.FechaPago)}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0' }}>{fmt.money(p.Monto)}</td>
                    <td style={s.td}>{p.MetodoPago}</td>
                    <td style={{ ...s.td, color: '#718096' }}>{p.Referencia || '—'}</td>
                    <td style={{ ...s.td, color: '#718096' }}>{p.Notas || '—'}</td>
                    <td style={s.td}>
                      {p.ComprobanteUrl
                        ? <a href={`/api/uploads/${p.ComprobanteUrl}`} target="_blank" rel="noreferrer" style={{ color: '#3182ce', fontSize: 13 }}>Ver</a>
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Wrap>
  );
}

function Wrap({ children }) {
  return <div style={{ padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}
function KpiBox({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
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
    <button
      onClick={onClick}
      style={{
        padding: '9px 20px', border: 'none', background: 'none',
        fontSize: 14, cursor: 'pointer', fontWeight: active ? 700 : 400,
        color: active ? '#1a2035' : '#718096',
        borderBottom: active ? '2px solid #1a2035' : '2px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

const s = {
  header:      { marginBottom: 20 },
  back:        { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  titleRow:    { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  title:       { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a2035' },
  sub:         { margin: '6px 0 0', fontSize: 13, color: '#718096' },
  clienteLink: { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0 },
  kpiRow:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  progressCard:{ background: '#fff', borderRadius: 10, padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  progressLabel:{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4a5568', marginBottom: 8 },
  progressBar: { height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' },
  progressFill:{ height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 6, transition: 'width 0.4s ease' },
  progressDates:{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096', marginTop: 6 },
  detailCard:  { background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  cardTitle:   { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  detailGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 20px' },
  tabs:        { display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 0 },
  tableCard:   { background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:          { padding: '11px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:          { padding: '11px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  btnPri:      { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
