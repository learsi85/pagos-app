import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function DetalleFinanciamiento() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [fin,     setFin]     = useState(null);
  const [plan,    setPlan]    = useState([]);
  const [pagos,   setPagos]   = useState([]);
  const [tab,     setTab]     = useState('plan');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalApi.financiamiento(id),
      portalApi.plan(id),
      portalApi.pagos(id),
    ]).then(([rf, rp, rpg]) => {
      setFin(rf.data);
      setPlan(rp.data);
      setPagos(rpg.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ color: '#888' }}>Cargando…</p>;
  if (!fin)    return <p style={{ color: '#e53e3e' }}>No encontrado</p>;

  const pct = fin.MontoTotalPagar > 0
    ? Math.min(100, (fin.TotalPagado / fin.MontoTotalPagar) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <button style={s.back} onClick={() => navigate('/portal/financiamientos')}>← Mis financiamientos</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={s.title}>{fin.NombreProducto}</h1>
        {statusBadge(fin.Status)}
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
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[['plan','Plan de pagos'],['pagos','Historial de pagos']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead>
              <tr>{['#','Vencimiento','Monto','Pagado','Saldo','Status'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {plan.map((p) => (
                <tr key={p.PlanPagoId} style={{ background: p.Status === 'VENCIDO' ? '#fff5f5' : 'transparent' }}>
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
          {pagos.length === 0
            ? <p style={{ padding: 32, textAlign: 'center', color: '#718096', margin: 0 }}>Sin pagos registrados</p>
            : (
              <table style={s.table}>
                <thead>
                  <tr>{['Fecha','Monto','Método','Referencia'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.PagoId}>
                      <td style={s.td}>{fmt.date(p.FechaPago)}</td>
                      <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0' }}>{fmt.money(p.Monto)}</td>
                      <td style={s.td}>{p.MetodoPago}</td>
                      <td style={{ ...s.td, color: '#718096' }}>{p.Referencia || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </div>
  );
}

const s = {
  back:      { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 12 },
  title:     { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a2035' },
  kpiGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 14, marginBottom: 20 },
  card:      { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  bar:       { height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barFill:   { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 4, transition: 'width 0.4s' },
  tabs:      { display: 'flex', borderBottom: '1px solid #e2e8f0' },
  tab:       { padding: '9px 20px', border: 'none', background: 'none', fontSize: 14, cursor: 'pointer', color: '#718096', borderBottom: '2px solid transparent', fontWeight: 500 },
  tabActive: { color: '#1a2035', fontWeight: 700, borderBottom: '2px solid #1a2035' },
  tableCard: { background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '11px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:        { padding: '11px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
};
