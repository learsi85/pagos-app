import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productosApi } from '@/services/api';
import { fmt } from '@/utils/format';

const schema=z.object({Nombre:z.string().min(1,'Requerido'),Descripcion:z.string().optional(),PrecioBase:z.coerce.number().positive('Debe ser mayor a 0')});

export default function Productos() {
  const [productos,setProductos]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [saving,setSaving]=useState(false);
  const {register,handleSubmit,reset,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const load=async()=>{setLoading(true);try{const r=await productosApi.list();setProductos(r.data);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const openNew=()=>{reset({Nombre:'',Descripcion:'',PrecioBase:''});setModal('new');};
  const openEdit=(p)=>{reset(p);setModal(p);};

  const onSubmit=async(data)=>{
    setSaving(true);
    try{
      if(modal==='new'){await productosApi.create(data);toast.success('Producto creado');}
      else{await productosApi.update(modal.ProductoId,data);toast.success('Actualizado');}
      setModal(false);load();
    }catch(err){toast.error(err.response?.data?.error||'Error');}
    finally{setSaving(false);}
  };

  const toggle=async(p)=>{
    try{await productosApi.update(p.ProductoId,{IsActive:p.IsActive?0:1});toast.success(p.IsActive?'Desactivado':'Activado');load();}
    catch{toast.error('Error al cambiar estado');}
  };

  const s={td:{padding:'12px 14px',borderBottom:'1px solid #f7f7f7',color:'#2d3748'},th:{padding:'12px 14px',textAlign:'left',color:'#718096',fontWeight:600,fontSize:12,borderBottom:'2px solid #f0f0f0',background:'#fafafa',whiteSpace:'nowrap'},input:{width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}};

  return (
    <div style={{padding:'24px 20px',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:700,color:'#1a2035'}}>Productos</h1>
        <button style={{padding:'10px 20px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}} onClick={openNew}>+ Nuevo producto</button>
      </div>
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
        <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {loading?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Cargando…</p>:productos.length===0?<p style={{padding:40,textAlign:'center',color:'#718096',margin:0}}>Sin productos</p>:(
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:560}}>
              <thead><tr>{['Nombre','Descripción','Precio base','Status','Creado',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {productos.map(p=>(
                  <tr key={p.ProductoId} onMouseEnter={e=>e.currentTarget.style.background='#f7fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{...s.td,fontWeight:600,whiteSpace:'nowrap'}}>{p.Nombre}</td>
                    <td style={{...s.td,color:'#718096',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.Descripcion||'—'}</td>
                    <td style={{...s.td,fontWeight:600,color:'#2b6cb0',whiteSpace:'nowrap'}}>{fmt.money(p.PrecioBase)}</td>
                    <td style={s.td}><span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:12,fontWeight:600,color:p.IsActive?'#38a169':'#718096',background:p.IsActive?'#f0fff4':'#f7fafc',border:`1px solid ${p.IsActive?'#9ae6b4':'#e2e8f0'}`}}>{p.IsActive?'Activo':'Inactivo'}</span></td>
                    <td style={{...s.td,whiteSpace:'nowrap'}}>{fmt.date(p.CreatedAt)}</td>
                    <td style={s.td}>
                      <div style={{display:'flex',gap:8}}>
                        <button style={{background:'none',border:'none',color:'#3182ce',fontSize:13,cursor:'pointer',fontWeight:600,padding:0}} onClick={()=>openEdit(p)}>Editar</button>
                        <button style={{background:'none',border:'none',color:p.IsActive?'#e53e3e':'#38a169',fontSize:13,cursor:'pointer',fontWeight:600,padding:0}} onClick={()=>toggle(p)}>{p.IsActive?'Desactivar':'Activar'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:'28px 24px',width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#1a2035'}}>{modal==='new'?'Nuevo producto':'Editar producto'}</h2>
              <button style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#718096'}} onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              {[['Nombre','Nombre *',errors.Nombre],['Descripcion','Descripción',null]].map(([name,label,err])=>(
                <div key={name} style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>{label}</label>
                  {name==='Descripcion'?<textarea {...register(name)} style={{...s.input,minHeight:70,resize:'vertical'}}/>:<input {...register(name)} style={s.input}/>}
                  {err&&<p style={{color:'#e53e3e',fontSize:12,marginTop:2}}>{err.message}</p>}
                </div>
              ))}
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>Precio base (MXN) *</label>
                <input {...register('PrecioBase')} type="number" step="0.01" min="0" style={s.input}/>
                {errors.PrecioBase&&<p style={{color:'#e53e3e',fontSize:12,marginTop:2}}>{errors.PrecioBase.message}</p>}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:20}}>
                <button type="button" style={{padding:'10px 20px',background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,cursor:'pointer'}} onClick={()=>setModal(false)}>Cancelar</button>
                <button type="submit" disabled={saving} style={{padding:'10px 20px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{saving?'Guardando…':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
