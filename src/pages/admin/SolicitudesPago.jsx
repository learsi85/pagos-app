import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { solicitudesPagoApi } from '@/services/api';
import { useCan } from '@/store/authStore';
import { fmt } from '@/utils/format';

const uploadsBase = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';
const FILTROS = [
  { value: 'PENDIENTE', label: 'Pendientes' }, { value: 'APROBADO', label: 'Aprobadas' },
  { value: 'RECHAZADO', label: 'Rechazadas' }, { value: '', label: 'Todas' },
];
const BADGE = {
  PENDIENTE: ['#975a16', '#fffaf0', '#fbd38d', 'Pendiente'],
  APROBADO:  ['#276749', '#f0fff4', '#9ae6b4', 'Aprobada'],
  RECHAZADO: ['#c53030', '#fff5f5', '#feb2b2', 'Rechazada'],
};
const s = {
  th: { padding:'12px 14px', textAlign:'left', color:'#718096', fontWeight:600, fontSize:12, borderBottom:'2px solid #f0f0f0', background:'#fafafa', whiteSpace:'nowrap' },
  td: { padding:'12px 14px', borderBottom:'1px solid #f7f7f7', color:'#2d3748' },
};

export default function SolicitudesPago() {
  const navigate = useNavigate();
  const can = useCan();
  const [filas, setFilas]         = useState([]);
  const [status, setStatus]       = useState('PENDIENTE');
  const [loading, setLoading]     = useState(true);
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo]       = useState('');
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await solicitudesPagoApi.list(status ? { status } : {}); setFilas(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  const rechazar = async () => {
    if (motivo.trim().length < 5) return toast.error('Describe el motivo (mínimo 5 caracteres)');
    setSaving(true);
    try {
      await solicitudesPagoApi.rechazar(rechazando.SolicitudPagoId, { motivo });
      toast.success('Solicitud rechazada');
      setRechazando(null); setMotivo(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al rechazar'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding:'24px 20px', fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <h1 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700, color:'#1a2035' }}>Pagos por autorizar</h1>

      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
        {FILTROS.map(f => {
          const active = status === f.value;
          return <button key={f.value} onClick={() => setStatus(f.value)}
            style={{ padding:'7px 16px', border:`1px solid ${active?'#1a2035':'#e2e8f0'}`, borderRadius:20, fontSize:13, cursor:'pointer', background:active?'#1a2035':'#fff', color:active?'#fff':'#4a5568', whiteSpace:'nowrap', flexShrink:0 }}>{f.label}</button>;
        })}
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,.07)', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          {loading ? <p style={{ padding:40, textAlign:'center', color:'#718096', margin:0 }}>Cargando…</p>
          : filas.length === 0 ? <p style={{ padding:40, textAlign:'center', color:'#718096', margin:0 }}>Sin solicitudes</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:860 }}>
              <thead><tr>{['Enviada','Cliente','Financiamiento','Monto','Fecha de pago','Método / Ref.','Comprobante','Estatus',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filas.map(x => {
                  const [color, bg, border, label] = BADGE[x.Status] || BADGE.PENDIENTE;
                  return (
                    <tr key={x.SolicitudPagoId}>
                      <td style={{ ...s.td, whiteSpace:'nowrap' }}>{fmt.dateTime ? fmt.dateTime(x.CreatedAt) : fmt.date(x.CreatedAt)}</td>
                      <td style={{ ...s.td, fontWeight:600, whiteSpace:'nowrap' }}>{x.ApellidoPaterno}, {x.Nombre}</td>
                      <td style={{ ...s.td, whiteSpace:'nowrap' }}>#{x.FinanciamientoId} — {x.NombreProducto}</td>
                      <td style={{ ...s.td, fontWeight:600, color:'#2b6cb0', whiteSpace:'nowrap' }}>{fmt.money(x.Monto)}</td>
                      <td style={{ ...s.td, whiteSpace:'nowrap' }}>{fmt.date(x.FechaPago)}</td>
                      <td style={{ ...s.td, whiteSpace:'nowrap' }}>{x.MetodoPago}{x.Referencia ? <div style={{ fontSize:11, color:'#718096' }}>{x.Referencia}</div> : null}</td>
                      <td style={s.td}><a href={`${uploadsBase}/${x.ComprobanteUrl}`} target="_blank" rel="noreferrer" style={{ color:'#3182ce' }}>Ver</a></td>
                      <td style={s.td}>
                        <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:12, fontSize:12, fontWeight:600, color, background:bg, border:`1px solid ${border}` }}>{label}</span>
                        {x.Status === 'RECHAZADO' && x.MotivoRechazo && <div style={{ fontSize:11, color:'#718096', marginTop:3, maxWidth:200 }}>{x.MotivoRechazo}</div>}
                      </td>
                      <td style={s.td}>
                        {x.Status === 'PENDIENTE' && can('solicitudes_pago.autorizar') && (
                          <div style={{ display:'flex', gap:10, whiteSpace:'nowrap' }}>
                            <button onClick={() => navigate(`/financiamientos/${x.FinanciamientoId}/pago?solicitud=${x.SolicitudPagoId}`)}
                              style={{ background:'none', border:'none', color:'#38a169', fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}>Autorizar</button>
                            <button onClick={() => setRechazando(x)}
                              style={{ background:'none', border:'none', color:'#e53e3e', fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}>Rechazar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rechazando && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={(e) => e.target === e.currentTarget && setRechazando(null)}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:'100%', maxWidth:420 }}>
            <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#1a2035' }}>Rechazar solicitud</h3>
            <p style={{ margin:'0 0 14px', fontSize:13, color:'#718096' }}>
              {rechazando.Nombre} {rechazando.ApellidoPaterno} · {fmt.money(rechazando.Monto)}. El cliente verá el motivo en su portal.
            </p>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. El comprobante no es legible, el monto no coincide…"
              style={{ width:'100%', minHeight:70, padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
              <button onClick={() => { setRechazando(null); setMotivo(''); }} style={{ padding:'9px 18px', background:'#fff', color:'#4a5568', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, cursor:'pointer' }}>Volver</button>
              <button onClick={rechazar} disabled={saving} style={{ padding:'9px 18px', background:'#e53e3e', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>{saving ? 'Rechazando…' : 'Confirmar rechazo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}