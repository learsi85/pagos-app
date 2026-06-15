import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '@/services/api';
import { fmt } from '@/utils/format';

export default function Dashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><p style={{ color: '#888' }}>Cargando…</p></PageShell>;
  if (!data)   return <PageShell><p style={{ color: '#e53e3e' }}>Error al cargar</p></PageShell>;

  const { kpis, pagos_recientes, proximos_vencer } = data;

  const chartData = [
    { name: 'Cobrado',    value: parseFloat(kpis.cobrado)    || 0 },
    { name: 'Por cobrar', value: parseFloat(kpis.por_cobrar) || 0 },
  ];

  return (
    <PageShell>
      <h1 style={s.title}>Dashboard</h1>

      {/* KPI cards */}
      <div style={s.kpiGrid}>
        <KpiCard label="Clientes"           value={kpis.total_clientes}        color="#3182ce" />
        <KpiCard label="Financiamientos activos" value={kpis.financiamientos_activos} color="#38a169" />
        <KpiCard label="Cartera total"      value={fmt.money(kpis.cartera_total)} color="#6b46c1" />
        <KpiCard label="Por cobrar"         value={fmt.money(kpis.por_cobrar)}   color="#dd6b20" />
        <KpiCard label="Cobrado"            value={fmt.money(kpis.cobrado)}      color="#2b6cb0" />
        <KpiCard label="Vencidos"           value={kpis.vencidos}                color="#e53e3e" />
      </div>

      <div style={s.row}>
        {/* Gráfica */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Cartera</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={60}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt.shortMoney(v)} />
              <Tooltip formatter={(v) => fmt.money(v)} />
              <Bar dataKey="value" fill="#3182ce" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Próximos a vencer */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Vencimientos esta semana</h2>
          {proximos_vencer.length === 0
            ? <p style={{ color: '#888', fontSize: 14 }}>Sin vencimientos próximos</p>
            : proximos_vencer.slice(0, 6).map((v, i) => (
              <div key={i} style={s.vencItem}>
                <div>
                  <div style={s.vencNombre}>{v.Nombre} {v.ApellidoPaterno}</div>
                  <div style={s.vencProd}>{v.Producto}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={s.vencMonto}>{fmt.money(v.SaldoPendiente)}</div>
                  <div style={s.vencFecha}>{fmt.date(v.FechaVencimiento)}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Pagos recientes */}
      <div style={{ ...s.card, marginTop: 24 }}>
        <h2 style={s.cardTitle}>Pagos recientes</h2>
        <table style={s.table}>
          <thead>
            <tr>
              {['Cliente','Producto','Método','Monto','Fecha'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagos_recientes.map((p) => (
              <tr key={p.PagoId} style={s.tr}>
                <td style={s.td}>{p.Nombre} {p.ApellidoPaterno}</td>
                <td style={s.td}>{p.Producto}</td>
                <td style={s.td}>{p.MetodoPago}</td>
                <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0' }}>{fmt.money(p.Monto)}</td>
                <td style={s.td}>{fmt.date(p.FechaPago)}</td>
              </tr>
            ))}
            {pagos_recientes.length === 0 && (
              <tr><td colSpan={5} style={{ ...s.td, color: '#888', textAlign: 'center' }}>Sin pagos recientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${color}` }}>
      <div style={{ ...s.kpiValue, color }}>{value ?? '—'}</div>
      <div style={s.kpiLabel}>{label}</div>
    </div>
  );
}

function PageShell({ children }) {
  return <div style={{ padding: '32px 40px' }}>{children}</div>;
}

const s = {
  title:     { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a2035' },
  kpiGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard:   { background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  kpiValue:  { fontSize: 26, fontWeight: 700, lineHeight: 1.2 },
  kpiLabel:  { fontSize: 12, color: '#718096', marginTop: 4 },
  row:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card:      { background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  vencItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' },
  vencNombre:{ fontSize: 13, fontWeight: 600, color: '#2d3748' },
  vencProd:  { fontSize: 12, color: '#718096' },
  vencMonto: { fontSize: 13, fontWeight: 700, color: '#e53e3e' },
  vencFecha: { fontSize: 11, color: '#718096' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '8px 12px', textAlign: 'left', color: '#718096', fontWeight: 600, borderBottom: '2px solid #f0f0f0', fontSize: 12 },
  td:        { padding: '10px 12px', color: '#2d3748', borderBottom: '1px solid #f7f7f7' },
  tr:        { transition: 'background 0.1s' },
};
