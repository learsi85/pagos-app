import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { financiamientosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const STATUSES = ['', 'ACTIVO', 'LIQUIDADO', 'VENCIDO', 'CANCELADO'];

export default function Financiamientos() {
  const navigate = useNavigate();
  const [fins,    setFins]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');

  const load = async (s = '') => {
    setLoading(true);
    try {
      const r = await financiamientosApi.list(s ? { status: s } : {});
      setFins(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Financiamientos</h1>
        <button style={s.btnPri} onClick={() => navigate('/financiamientos/nuevo')}>
          + Nuevo financiamiento
        </button>
      </div>

      {/* Filtros de status */}
      <div style={s.tabs}>
        {STATUSES.map((st) => (
          <button
            key={st}
            style={{ ...s.tab, ...(status === st ? s.tabActive : {}) }}
            onClick={() => setStatus(st)}
          >
            {st || 'Todos'}
          </button>
        ))}
      </div>

      <div style={s.tableCard}>
        {loading ? (
          <p style={s.empty}>Cargando…</p>
        ) : fins.length === 0 ? (
          <p style={s.empty}>Sin financiamientos</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['#','Cliente','Producto','Total','Pagado','Saldo','Vencimiento','Status',''].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fins.map((f) => (
                <tr
                  key={f.FinanciamientoId}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, color: '#718096' }}>{f.FinanciamientoId}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{f.ApellidoPaterno}, {f.Nombre}</div>
                    <div style={{ fontSize: 11, color: '#718096' }}>{f.Email}</div>
                  </td>
                  <td style={s.td}>{f.NombreProducto}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{fmt.money(f.MontoTotalPagar)}</td>
                  <td style={{ ...s.td, color: '#38a169', fontWeight: 600 }}>{fmt.money(f.TotalPagado)}</td>
                  <td style={{
                    ...s.td, fontWeight: 600,
                    color: +f.SaldoPendiente > 0 ? '#e53e3e' : '#38a169',
                  }}>
                    {fmt.money(f.SaldoPendiente)}
                  </td>
                  <td style={s.td}>{fmt.date(f.FechaVencimiento)}</td>
                  <td style={s.td}>{statusBadge(f.Status)}</td>
                  <td style={s.td}>
                    <button
                      style={s.btnLink}
                      onClick={() => navigate(`/financiamientos/${f.FinanciamientoId}`)}
                    >
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap:      { padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:     { margin: 0, fontSize: 24, fontWeight: 700, color: '#1a2035' },
  btnPri:    { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnLink:   { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  tabs:      { display: 'flex', gap: 4, marginBottom: 16 },
  tab:       { padding: '7px 16px', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#4a5568', transition: 'all 0.15s' },
  tabActive: { background: '#1a2035', color: '#fff', borderColor: '#1a2035' },
  tableCard: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '12px 14px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa' },
  td:        { padding: '12px 14px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
  empty:     { padding: 40, textAlign: 'center', color: '#718096', margin: 0 },
};
