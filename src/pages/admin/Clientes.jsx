import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { clientesApi } from '@/services/api';
import { fmt, statusBadge } from '@/utils/format';

const schema = z.object({
  Nombre:          z.string().min(1,'Requerido'),
  ApellidoPaterno: z.string().min(1,'Requerido'),
  ApellidoMaterno: z.string().optional(),
  RFC:             z.string().optional(),
  Email:           z.string().email('Email inválido'),
  Telefono:        z.string().optional(),
  Direccion:       z.string().optional()
});

export default function Clientes() {
  const navigate=useNavigate();
  const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');const [modal,setModal]=useState(false);const [saving,setSaving]=useState(false);const [tokenInfo,setTokenInfo]=useState(null);
  const {register,handleSubmit,reset,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const load=async(query='')=>{setLoading(true);try{const r=await clientesApi.list(query?{q:query}:{});setClientes(r.data);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);

  const onStore=async(data)=>{
    setSaving(true);
    try{const r=await clientesApi.create(data);setTokenInfo({email:data.Email,token:r.data.token_primer_acceso,expira:r.data.token_expira});reset();load();toast.success('Cliente registrado');}
    catch(err){toast.error(err.response?.data?.error||'Error al guardar');}
    finally{setSaving(false);}
  };

  const s={wrap:{padding:'24px 20px',fontFamily:"'Inter','Segoe UI',sans-serif"},card:{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'},scroll:{overflowX:'auto',WebkitOverflowScrolling:'touch'},table:{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:600},th:{padding:'12px 14px',textAlign:'left',color:'#718096',fontWeight:600,fontSize:12,borderBottom:'2px solid #f0f0f0',background:'#fafafa',whiteSpace:'nowrap'},td:{padding:'12px 14px',borderBottom:'1px solid #f7f7f7',color:'#2d3748'},overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16},modal:{background:'#fff',borderRadius:12,padding:'28px 24px',width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto'},input:{width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}};

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:'#1a2035'}}>Clientes</h1>
        <button style={{padding:'10px 20px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}} onClick={()=>{setModal(true);setTokenInfo(null);}}>+ Nuevo cliente</button>
      </div>
      <form onSubmit={(e)=>{e.preventDefault();load(q);}} style={{display:'flex',gap:8,marginBottom:16}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nombre, email o RFC…" style={{flex:1,...s.input,minWidth:0}} />
        <button type="submit" style={{padding:'9px 18px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,cursor:'pointer'}}>Buscar</button>
      </form>
      <div style={s.card}>
        <div style={s.scroll}>
          {loading?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Cargando…</p>:clientes.length===0?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Sin resultados</p>:(
            <table style={s.table}>
              <thead><tr>{['Nombre','RFC','Email','Teléfono','Status','Desde',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {clientes.map(c=>(
                  <tr key={c.ClienteId} onMouseEnter={e=>e.currentTarget.style.background='#f7fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={s.td}><div style={{fontWeight:600,whiteSpace:'nowrap'}}>{c.ApellidoPaterno} {c.ApellidoMaterno||''}, {c.Nombre}</div></td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{c.RFC||'—'}</td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{c.Email}</td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{c.Telefono||'—'}</td>
                    <td style={s.td}>{statusBadge(c.Status)}</td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{fmt.date(c.CreatedAt)}</td>
                    <td style={s.td}><button style={{background:'none',border:'none',color:'#3182ce',fontSize:13,cursor:'pointer',fontWeight:600}} onClick={()=>navigate(`/clientes/${c.ClienteId}`)}>Ver →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal&&(
        <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={s.modal}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#1a2035'}}>Nuevo cliente</h2>
              <button onClick={()=>{setModal(false);setTokenInfo(null);}} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#718096'}}>✕</button>
            </div>
            {tokenInfo?(
              <div style={{background:'#f0fff4',border:'1px solid #9ae6b4',borderRadius:8,padding:20}}>
                <p style={{marginTop:0,fontWeight:600}}>✅ Cliente creado exitosamente</p>
                <p style={{fontSize:13,color:'#4a5568'}}>Comparte este enlace con <strong>{tokenInfo.email}</strong>:</p>
                <code style={{display:'block',background:'#fff',border:'1px solid #e2e8f0',borderRadius:6,padding:'10px 12px',fontSize:11,wordBreak:'break-all',margin:'8px 0'}}>
                  {window.location.origin}/portal/acceso?token={tokenInfo.token}&email={encodeURIComponent(tokenInfo.email)}
                </code>
                <p style={{fontSize:12,color:'#718096',marginBottom:0}}>Expira: {fmt.dateTime(tokenInfo.expira)}</p>
                <button style={{width:'100%',marginTop:16,padding:'10px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}
                  onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/portal/acceso?token=${tokenInfo.token}&email=${encodeURIComponent(tokenInfo.email)}`);toast.success('Enlace copiado');}}>
                  Copiar enlace
                </button>
                <button style={{width:'100%',marginTop:8,padding:'10px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,cursor:'pointer'}} onClick={()=>{setModal(false);setTokenInfo(null);}}>Cerrar</button>
              </div>
            ):(
              <form onSubmit={handleSubmit(onStore)}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px 16px',marginBottom:20}}>
                  {[['Nombre','Nombre *'],['ApellidoPaterno','Apellido paterno *'],['ApellidoMaterno','Apellido materno'],['RFC','RFC'],['Telefono','Teléfono']].map(([name,label])=>(
                    <div key={name}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>{label}</label>
                      <input {...register(name)} style={s.input} />
                      {errors[name]&&<p style={{color:'#e53e3e',fontSize:12,marginTop:2}}>{errors[name].message}</p>}
                    </div>
                  ))}
                  <div style={{gridColumn:'1 / -1'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>Email *</label>
                    <input {...register('Email')} type="email" style={s.input} />
                    {errors.Email&&<p style={{color:'#e53e3e',fontSize:12,marginTop:2}}>{errors.Email.message}</p>}
                  </div>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>Dirección</label>
                    <input {...register('Direccion')} style={s.input} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                  <button type="button" style={{padding:'10px 20px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,cursor:'pointer'}} onClick={()=>setModal(false)}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{padding:'10px 20px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{saving?'Guardando…':'Crear cliente'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
