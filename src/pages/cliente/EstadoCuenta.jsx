import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function EstadoCuenta() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalApi.estadoCuenta().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#888', padding: 40 }}>Cargando…</p>;
  if (!data)   return <p style={{ color: '#e53e3e', padding: 40 }}>Error al cargar</p>;

  const { resumen, proximos_pagos } = data;
  const pct = +resumen.total_comprometido > 0
    ? Math.min(100, (+resumen.total_pagado / +resumen.total_comprometido) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <h1 style={s.title}>Estado de cuenta</h1>

      <div style={s.kpiGrid}>
        {[
          { label: 'Financiamientos activos', value: resumen.activos || 0,                     color: '#3182ce' },
          { label: 'Total comprometido',      value: fmt.money(resumen.total_comprometido),     color: '#6b46c1' },
          { label: 'Total pagado',            value: fmt.money(resumen.total_pagado),           color: '#38a169' },
          { label: 'Saldo pendiente',         value: fmt.money(resumen.saldo_pendiente),
            color: +resumen.saldo_pendiente > 0 ? '#e53e3e' : '#38a169' },
        ].map((k, i) => (
          <div key={i} style={{ ...s.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, wordBreak: 'break-word' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {+resumen.total_comprometido > 0 && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>Progreso global</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3182ce' }}>{pct.toFixed(1)}%</span>
          </div>
          <div style={s.bar}><div style={{ ...s.barFill, width: `${pct}%` }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#718096', marginTop: 6 }}>
            <span>Liquidados: {resumen.liquidados || 0}</span>
            <span>Activos: {resumen.activos || 0}</span>
            {+resumen.vencidos > 0 && <span style={{ color: '#e53e3e', fontWeight: 600 }}>⚠ Vencidos: {resumen.vencidos}</span>}
          </div>
        </div>
      )}

      <div style={s.card}>
        <h2 style={s.cardTitle}>Próximos pagos — siguientes 28 días</h2>
        {proximos_pagos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>No tienes pagos próximos. ¡Al corriente!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximos_pagos.map((p) => {
              const dias = Math.ceil((new Date(p.FechaVencimiento) - new Date()) / 86400000);
              const urgente = dias <= 5;
              return (
                <div key={p.PlanPagoId}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, border: `1px solid ${urgente ? '#fed7d7' : '#e2e8f0'}`, background: urgente ? '#fff5f5' : '#f7fafc', cursor: 'pointer', transition: 'opacity .15s' }}
                  onClick={() => navigate(`/portal/financiamientos/${p.FinanciamientoId}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2035', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.NombreProducto}</div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{p.Empresa} · Cuota #{p.NumeroPago}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: urgente ? '#e53e3e' : '#2d3748' }}>{fmt.money(p.SaldoPendiente)}</div>
                    <div style={{ fontSize: 12, color: '#718096' }}>Vence {fmt.date(p.FechaVencimiento)}</div>
                    {urgente && <div style={{ fontSize: 11, color: '#e53e3e', fontWeight: 700 }}>⚠ {dias <= 0 ? 'Vencido' : `${dias} día${dias !== 1 ? 's' : ''}`}</div>}
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

const s = {
  title:   { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 20 },
  kpiCard: { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' },
  card:    { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 20 },
  cardTitle:{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  bar:     { height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 5, transition: 'width .4s' },
};
