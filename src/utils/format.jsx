import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

export const fmt = {
  money: (v) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
      .format(parseFloat(v) || 0),

  shortMoney: (v) => {
    const n = parseFloat(v) || 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  },

  date: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
  dateTime: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',

  pct: (v) => `${parseFloat(v).toFixed(2)} %`,

  status: {
    ACTIVO:    { label: 'Activo',    color: '#38a169', bg: '#f0fff4' },
    LIQUIDADO: { label: 'Liquidado', color: '#3182ce', bg: '#ebf8ff' },
    VENCIDO:   { label: 'Vencido',   color: '#e53e3e', bg: '#fff5f5' },
    CANCELADO: { label: 'Cancelado', color: '#718096', bg: '#f7fafc' },
    PENDIENTE: { label: 'Pendiente', color: '#dd6b20', bg: '#fffaf0' },
    PAGADO:    { label: 'Pagado',    color: '#38a169', bg: '#f0fff4' },
    PARCIAL:   { label: 'Parcial',   color: '#d69e2e', bg: '#fffff0' },
  },
};

export function statusBadge(status) {
  const s = fmt.status[status] || { label: status, color: '#718096', bg: '#f7fafc' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}
