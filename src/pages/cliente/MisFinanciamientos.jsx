import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function MisFinanciamientos() {
  const [fins,    setFins]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    portalApi.financiamientos()
      .then((r) => setFins(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#888', padding: 40 }}>Cargando…</p>;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <h1 style={s.title}>Mis financiamientos</h1>

      {fins.length === 0 ? (
        <div style={s.card}>
          <p style={{ color: '#718096', fontSize: 14, margin: 0 }}>
            No tienes financiamientos registrados.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fins.map((f) => {
            const pct = f.MontoTotalPagar > 0
              ? Math.min(100, (f.TotalPagado / f.MontoTotalPagar) * 100)
              : 0;
            return (
              <div
                key={f.FinanciamientoId}
                style={s.finCard}
                onClick={() => navigate(`/portal/financiamientos/${f.FinanciamientoId}`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'}
              >
                {/* Cabecera */}
                <div style={s.finHeader}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2035' }}>
                      {f.NombreProducto}
                    </div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{f.Empresa}</div>
                  </div>
                  {statusBadge(f.Status)}
                </div>

                {/* KPIs */}
                <div style={s.finKpis}>
                  <FinKpi label="Total"   value={fmt.money(f.MontoTotalPagar)} />
                  <FinKpi label="Pagado"  value={fmt.money(f.TotalPagado)}     color="#38a169" />
                  <FinKpi label="Saldo"   value={fmt.money(f.SaldoPendiente)}
                    color={+f.SaldoPendiente > 0 ? '#e53e3e' : '#38a169'} />
                  <FinKpi label="Cuotas"
                    value={`${f.NumeroPagos} × ${fmt.money(f.MontoPorPago)}`} />
                </div>

                {/* Barra de progreso */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#718096', marginBottom: 4 }}>
                    <span>Inicio: {fmt.date(f.FechaInicio)}</span>
                    <span style={{ fontWeight: 600 }}>{pct.toFixed(0)}% pagado</span>
                    <span>Vence: {fmt.date(f.FechaVencimiento)}</span>
                  </div>
                  <div style={s.bar}>
                    <div style={{ ...s.barFill, width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FinKpi({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: color || '#2d3748' }}>{value}</div>
    </div>
  );
}

const s = {
  title:   { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1a2035' },
  card:    { background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  finCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  finHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  finKpis: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
  bar:     { height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg,#3182ce,#63b3ed)', borderRadius: 4, transition: 'width 0.4s' },
};
