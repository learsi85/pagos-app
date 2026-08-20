import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientesApi, financiamientosApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

export default function ClienteDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [fins,    setFins]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(()=>{
    Promise.all([clientesApi.get(id),financiamientosApi.list({cliente_id:id})])
      .then(([rc,rf])=>{setCliente(rc.data);setFins(rf.data);reset(rc.data);})
      .finally(()=>setLoading(false));
  },[id]);

  const onSave=async(data)=>{
    setSaving(true);
    try{await clientesApi.update(id,data);setCliente(prev=>({...prev,...data}));setEditing(false);toast.success('Actualizado');}
    catch(err){toast.error(err.response?.data?.error||'Error al guardar');}
    finally{setSaving(false);}
  };

  const s={td:{padding:'11px 14px',borderBottom:'1px solid #f7f7f7',color:'#2d3748'},th:{padding:'10px 14px',textAlign:'left',color:'#718096',fontWeight:600,fontSize:12,borderBottom:'2px solid #f0f0f0',background:'#fafafa',whiteSpace:'nowrap'},input:{width:'100%',padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:7,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}};

  if(loading)return <div style={{padding:40}}><p style={{color:'#888'}}>Cargando…</p></div>;
  if(!cliente)return <div style={{padding:40}}><p style={{color:'#e53e3e'}}>No encontrado</p></div>;

  return (
    <div style={{padding:'24px 20px',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <button style={{background:'none',border:'none',color:'#3182ce',fontSize:14,cursor:'pointer',padding:0,marginBottom:8}} onClick={()=>navigate('/clientes')}>← Clientes</button>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <h1 style={{margin:0,fontSize:20,fontWeight:700,color:'#1a2035'}}>{cliente.ApellidoPaterno} {cliente.ApellidoMaterno||''}, {cliente.Nombre}</h1>
        {statusBadge(cliente.Status)}
      </div>

      <div style={{background:'#fff',borderRadius:12,padding:'22px 26px',boxShadow:'0 1px 4px rgba(0,0,0,.07)',marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h2 style={{margin:0,fontSize:15,fontWeight:600,color:'#2d3748'}}>Datos generales</h2>
          {!editing&&<button style={{padding:'8px 16px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:7,fontSize:13,cursor:'pointer'}} onClick={()=>setEditing(true)}>Editar</button>}
        </div>
        {editing?(
          <form onSubmit={handleSubmit(onSave)}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'14px 20px'}}>
              {[['Nombre','Nombre'],['ApellidoPaterno','Ap. paterno'],['ApellidoMaterno','Ap. materno'],['RFC','RFC'],['Email','Email'],['Telefono','Teléfono']].map(([name,label])=>(
                <div key={name}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#718096',marginBottom:3}}>{label}</label><input {...register(name)} style={s.input}/></div>
              ))}
              <div style={{gridColumn:'1 / -1'}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'#718096',marginBottom:3}}>Dirección</label><input {...register('Direccion')} style={s.input}/></div>
              <div><label style={{display:'block',fontSize:11,fontWeight:600,color:'#718096',marginBottom:3}}>Status</label>
                <select {...register('Status')} style={s.input}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button type="button" style={{padding:'9px 18px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:7,fontSize:13,cursor:'pointer'}} onClick={()=>{setEditing(false);reset(cliente);}}>Cancelar</button>
              <button type="submit" disabled={saving} style={{padding:'9px 18px',background:'#1a2035',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer'}}>{saving?'Guardando…':'Guardar'}</button>
            </div>
          </form>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'14px 20px'}}>
            {[['RFC',cliente.RFC],['Email',cliente.Email],['Teléfono',cliente.Telefono],['Registrado',fmt.date(cliente.CreatedAt)],['Último login',fmt.dateTime(cliente.LastLoginAt)]].map(([l,v])=>(
              <div key={l}><div style={{fontSize:11,color:'#718096',fontWeight:600,marginBottom:2}}>{l}</div><div style={{fontSize:14,color:'#2d3748'}}>{v||'—'}</div></div>
            ))}
            {cliente.Direccion&&<div style={{gridColumn:'1 / -1'}}><div style={{fontSize:11,color:'#718096',fontWeight:600,marginBottom:2}}>Dirección</div><div style={{fontSize:14,color:'#2d3748'}}>{cliente.Direccion}</div></div>}
          </div>
        )}
      </div>

      <div style={{background:'#fff',borderRadius:12,padding:'22px 26px',boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h2 style={{margin:0,fontSize:15,fontWeight:600,color:'#2d3748'}}>Financiamientos ({fins.length})</h2>
          <button style={{padding:'9px 18px',background:'#1a2035',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer'}} onClick={()=>navigate(`/financiamientos/nuevo?cliente_id=${id}`)}>+ Nuevo financiamiento</button>
        </div>
        {fins.length===0?<p style={{color:'#718096',fontSize:14}}>Sin financiamientos.</p>:(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:600}}>
              <thead><tr>{['Producto','Inicio','Total','Pagado','Saldo','Status',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {fins.map(f=>(
                  <tr key={f.FinanciamientoId} onMouseEnter={e=>e.currentTarget.style.background='#f7fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{f.NombreProducto}</td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{fmt.date(f.FechaInicio)}</td>
                    <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap'}}>{fmt.money(f.MontoTotalPagar)}</td>
                    <td style={{...s.td,color:'#38a169',fontWeight:600,whiteSpace:'nowrap'}}>{fmt.money(f.TotalPagado)}</td>
                    <td style={{...s.td,color:+f.SaldoPendiente>0?'#e53e3e':'#38a169',fontWeight:600,whiteSpace:'nowrap'}}>{fmt.money(f.SaldoPendiente)}</td>
                    <td style={s.td}>{statusBadge(f.Status)}</td>
                    <td style={s.td}><button style={{background:'none',border:'none',color:'#3182ce',fontSize:13,cursor:'pointer',fontWeight:600}} onClick={()=>navigate(`/financiamientos/${f.FinanciamientoId}`)}>Ver →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
