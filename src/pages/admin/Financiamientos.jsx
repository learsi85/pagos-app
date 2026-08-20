import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { financiamientosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const STATUSES=[{value:'',label:'Todos'},{value:'ACTIVO',label:'Activo'},{value:'LIQUIDADO',label:'Liquidado'},{value:'VENCIDO',label:'Vencido'},{value:'CANCELADO',label:'Cancelado'}];

export default function Financiamientos() {
  const navigate=useNavigate();
  const [fins,setFins]=useState([]);const [loading,setLoading]=useState(true);const [status,setStatus]=useState('');

  const load=async(s='')=>{setLoading(true);try{const r=await financiamientosApi.list(s?{status:s}:{});setFins(r.data);}finally{setLoading(false);}};
  useEffect(()=>{load(status);},[status]);

  const s={th:{padding:'12px 14px',textAlign:'left',color:'#718096',fontWeight:600,fontSize:12,borderBottom:'2px solid #f0f0f0',background:'#fafafa',whiteSpace:'nowrap'},td:{padding:'12px 14px',borderBottom:'1px solid #f7f7f7',color:'#2d3748'}};

  return (
    <div style={{padding:'24px 20px',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:'#1a2035'}}>Financiamientos</h1>
        <button style={{padding:'10px 20px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>navigate('/financiamientos/nuevo')}>+ Nuevo</button>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4,WebkitOverflowScrolling:'touch'}}>
        {STATUSES.map(st=>{
          const active=status===st.value;
          return <button key={st.value} style={{padding:'7px 16px',border:`1px solid ${active?'#1a2035':'#e2e8f0'}`,borderRadius:20,fontSize:13,cursor:'pointer',background:active?'#1a2035':'#fff',color:active?'#fff':'#4a5568',transition:'all .15s',whiteSpace:'nowrap',flexShrink:0}} onClick={()=>setStatus(st.value)}>{st.label}</button>;
        })}
      </div>

      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
        <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {loading?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Cargando…</p>:fins.length===0?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Sin financiamientos</p>:(
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:700}}>
              <thead><tr>{['#','Cliente','Producto','Total','Pagado','Saldo','Vencimiento','Status',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {fins.map(f=>(
                  <tr key={f.FinanciamientoId} onMouseEnter={e=>e.currentTarget.style.background='#f7fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{...s.td,color:'#718096'}}>{f.FinanciamientoId}</td>
                    <td style={s.td}><div style={{fontWeight:600,whiteSpace:'nowrap'}}>{f.ApellidoPaterno}, {f.Nombre}</div><div style={{fontSize:11,color:'#718096'}}>{f.Email}</div></td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{f.NombreProducto}</td>
                    <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap'}}>{fmt.money(f.MontoTotalPagar)}</td>
                    <td style={{...s.td,color:'#38a169',fontWeight:600,whiteSpace:'nowrap'}}>{fmt.money(f.TotalPagado)}</td>
                    <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap',color:+f.SaldoPendiente>0?'#e53e3e':'#38a169'}}>{fmt.money(f.SaldoPendiente)}</td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{fmt.date(f.FechaVencimiento)}</td>
                    <td style={s.td}>{statusBadge(f.Status)}</td>
                    <td style={s.td}><button style={{background:'none',border:'none',color:'#3182ce',fontSize:13,cursor:'pointer',fontWeight:600}} onClick={()=>navigate(`/financiamientos/${f.FinanciamientoId}`)}>Ver →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
