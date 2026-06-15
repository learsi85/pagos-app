import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function EstadoCuenta() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalApi.estadoCuenta()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#888', padding: 40 }}>Cargando…</p>;
  if (!data)   return <p style={{ color: '#e53e3e', padding: 40 }}>Error al cargar</p>;

  const { resumen, proximos_pagos } = data;
  const pctGlobal = +resumen.total_comprometido > 0
    ? Math.min(100, (+resumen.total_pagado / +resumen.total_comprometido) * 100)
    : 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <h1 style={s.title}>Estado de cuenta</h1>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <Kpi label="Financiamientos activos" value={resumen.activos || 0}                        color="#3182ce" />
        <Kpi label="Total comprometido"       value={fmt.money(resumen.total_comprometido)}        color="#6b46c1" />
        <Kpi label="Total pagado"             value={fmt.money(resumen.total_pagado)}              color="#38a169" />
        <Kpi label="Saldo pendiente"          value={fmt.money(resumen.saldo_pendiente)}
          color={+resumen.saldo_pendiente > 0 ? '#e53e3e' : '#38a169'} />
      </div>

      {/* Progreso global */}
      {+resumen.total_comprometido > 0 && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
              Progreso global de pago
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3182ce' }}>
              {pctGlobal.toFixed(1)}%
            </span>
          </div>
          <div style={s.bar}>
            <div style={{ ...s.barFill, width: `${pctGlobal}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#718096' }}>
            <span>Liquidados: {resumen.liquidados || 0}</span>
            <span>Activos: {resumen.activos || 0}</span>
            {+resumen.vencidos > 0 && (
              <span style={{ color: '#e53e3e', fontWeight: 600 }}>⚠ Vencidos: {resumen.vencidos}</span>
            )}
          </div>
        </div>
      )}

      {/* Próximos pagos */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Próximos pagos — siguientes 28 días</h2>

        {proximos_pagos.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>
              No tienes pagos próximos. ¡Al corriente!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximos_pagos.map((p) => {
              const diasRestantes = Math.ceil(
                (new Date(p.FechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24)
              );
              const urgente = diasRestantes <= 5;
              return (
                <div
                  key={p.PlanPagoId}
                  style={{ ...s.proximoItem, borderColor: urgente ? '#fed7d7' : '#e2e8f0', background: urgente ? '#fff5f5' : '#f7fafc' }}
                  onClick={() => navigate(`/portal/financiamientos/${p.FinanciamientoId}`)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2035' }}>
                      {p.NombreProducto}
                    </div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                      {p.Empresa} · Cuota #{p.NumeroPago} · {p.FrecuenciaPago}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: urgente ? '#e53e3e' : '#2d3748' }}>
                      {fmt.money(p.SaldoPendiente)}
                    </div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                      Vence: {fmt.date(p.FechaVencimiento)}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {urgente
                        ? <span style={{ fontSize: 11, color: '#e53e3e', fontWeight: 700 }}>
                            ⚠ {diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`}
                          </span>
                        : statusBadge(p.Status)
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{label}</div>
    </div>
  );
}

const s = {
  title:       { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  kpiGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 20 },
  card:        { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  cardTitle:   { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  bar:         { height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  barFill:     { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 5, transition: 'width 0.4s' },
  emptyState:  { textAlign: 'center', padding: '24px 0' },
  proximoItem: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'opacity 0.15s' },
};
