import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '@/services/api';
import { fmt } from '@/utils/format';

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Shell><p style={{ color: '#888' }}>Cargando…</p></Shell>;
  if (!data)   return <Shell><p style={{ color: '#e53e3e' }}>Error al cargar</p></Shell>;

  const { kpis, moratorios, pagos_recientes, proximos_vencer, cargos_moratorio } = data;

  const chartData = [
    { name: 'Cobrado',    value: parseFloat(kpis.cobrado)    || 0 },
    { name: 'Por cobrar', value: parseFloat(kpis.por_cobrar) || 0 },
  ];

  return (
    <Shell>
      <h1 style={s.title}>Dashboard</h1>

      {/* ── KPIs principales ── */}
      <div style={s.kpiGrid}>
        <KpiCard label="Clientes"          value={kpis.total_clientes}          color="#3182ce" />
        <KpiCard label="Fin. activos"       value={kpis.financiamientos_activos}  color="#38a169" />
        <KpiCard label="Cartera total"      value={fmt.money(kpis.cartera_total)} color="#6b46c1" money />
        <KpiCard label="Por cobrar"         value={fmt.money(kpis.por_cobrar)}    color="#dd6b20" money />
        <KpiCard label="Cobrado"            value={fmt.money(kpis.cobrado)}       color="#2b6cb0" money />
        <KpiCard
          label="Cuotas vencidas"
          value={kpis.cuotas_vencidas}
          sub={kpis.cuotas_vencidas > 0 ? fmt.money(kpis.monto_vencido) : null}
          color="#e53e3e"
        />
      </div>

      {/* ── KPIs moratorio ── */}
      {parseFloat(moratorios?.total_cobrado) > 0 && (
        <div style={s.moratorioStrip}>
          <span style={s.moratorioTitle}>📋 Moratorios cobrados</span>
          <div style={s.moratorioKpis}>
            <MorKpi label="Cargos aplicados" value={moratorios.total_cargos} />
            <MorKpi label="Total cobrado"    value={fmt.money(moratorios.total_cobrado)} highlight />
          </div>
        </div>
      )}

      <div style={s.row}>
        {/* Gráfica */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Cartera</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={60}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt.shortMoney(v)} width={60} />
              <Tooltip formatter={(v) => fmt.money(v)} />
              <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Próximos a vencer */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Vencimientos esta semana</h2>
          {proximos_vencer.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>Sin vencimientos próximos</p>
          ) : (
            proximos_vencer.slice(0, 6).map((v, i) => (
              <div key={i} style={s.vencItem}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={s.vencNombre}>{v.Nombre} {v.ApellidoPaterno}</div>
                  <div style={s.vencProd}>{v.Producto}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={s.vencMonto}>{fmt.money(v.SaldoPendiente)}</div>
                  <div style={s.vencFecha}>{fmt.date(v.FechaVencimiento)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Pagos recientes (con columna moratorio) ── */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <h2 style={s.cardTitle}>Pagos recientes</h2>
        <div style={s.tableScroll}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Cliente','Producto','Método','Monto pago','Recargo mora','Fecha'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos_recientes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...s.td, color: '#888', textAlign: 'center' }}>
                    Sin pagos recientes
                  </td>
                </tr>
              ) : pagos_recientes.map((p) => (
                <tr key={p.PagoId}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{p.Nombre} {p.ApellidoPaterno}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{p.Producto}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{p.MetodoPago}</td>
                  <td style={{ ...s.td, fontWeight: 600, color: '#2b6cb0', whiteSpace: 'nowrap' }}>
                    {fmt.money(p.Monto)}
                  </td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    {parseFloat(p.MoratorioAplicado) > 0
                      ? <span style={{ color: '#e53e3e', fontWeight: 600 }}>{fmt.money(p.MoratorioAplicado)}</span>
                      : <span style={{ color: '#a0aec0' }}>—</span>
                    }
                  </td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(p.FechaPago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Últimos cargos moratorios ── */}
      {cargos_moratorio?.length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <h2 style={s.cardTitle}>Cargos por mora recientes</h2>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Cliente','Producto','Cuota','Días retraso','Recargo cobrado','Fecha'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargos_moratorio.map((c) => (
                  <tr key={c.CargoId}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{c.Nombre} {c.ApellidoPaterno}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{c.Producto}</td>
                    <td style={s.td}>#{c.NumeroPago} — {fmt.date(c.FechaVencimiento)}</td>
                    <td style={{ ...s.td, color: '#e53e3e', fontWeight: 600 }}>{c.DiasRetraso} días</td>
                    <td style={{ ...s.td, color: '#e53e3e', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fmt.money(c.MontoAplicado)}
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmt.date(c.AplicadoAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}

function KpiCard({ label, value, color, money, sub }) {
  return (
    <div style={{ ...s.kpiCard, borderTop: `3px solid ${color}`, minWidth: 0 }}>
      <div style={{ fontSize: money ? 17 : 26, fontWeight: 700, color, wordBreak: 'break-word', lineHeight: 1.2 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      <div style={s.kpiLabel}>{label}</div>
    </div>
  );
}

function MorKpi({ label, value, highlight }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: highlight ? 18 : 15, fontWeight: 700, color: highlight ? '#e53e3e' : '#2d3748' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#718096' }}>{label}</div>
    </div>
  );
}

function Shell({ children }) {
  return <div style={{ padding: '24px 20px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>{children}</div>;
}

const s = {
  title:          { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  kpiGrid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 16 },
  kpiCard:        { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  kpiLabel:       { fontSize: 11, color: '#718096', marginTop: 4 },
  moratorioStrip: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: '12px 20px', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  moratorioTitle: { fontSize: 13, fontWeight: 700, color: '#c53030' },
  moratorioKpis:  { display: 'flex', gap: 32 },
  row:            { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 },
  card:           { background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle:      { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  vencItem:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', gap: 8 },
  vencNombre:     { fontSize: 13, fontWeight: 600, color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  vencProd:       { fontSize: 12, color: '#718096' },
  vencMonto:      { fontSize: 13, fontWeight: 700, color: '#e53e3e', whiteSpace: 'nowrap' },
  vencFecha:      { fontSize: 11, color: '#718096' },
  tableScroll:    { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table:          { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 },
  th:             { padding: '8px 12px', textAlign: 'left', color: '#718096', fontWeight: 600, borderBottom: '2px solid #f0f0f0', fontSize: 12, whiteSpace: 'nowrap' },
  td:             { padding: '10px 12px', color: '#2d3748', borderBottom: '1px solid #f7f7f7' },
};
