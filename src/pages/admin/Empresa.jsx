import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { empresaApi } from '@/services/api';
import { useAdminStore } from '@/store/authStore';

export default function Empresa() {
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  const {register,handleSubmit,reset}=useForm();
  const clearAuth=useAdminStore(s=>s.clearAuth);const navigate=useNavigate();

  useEffect(()=>{
    empresaApi.get().then(r=>reset(r.data)).catch(err=>{if(err.response?.status===404)reset({});}).finally(()=>setLoading(false));
  },[]);

  const onSubmit=async(data)=>{
    setSaving(true);
    try{
      const r=await empresaApi.update(data);
      if(r.data.nota){toast.success('Empresa registrada. Vuelve a iniciar sesión.');clearAuth();setTimeout(()=>navigate('/login'),1500);}
      else{toast.success('Datos actualizados');}
    }catch(err){toast.error(err.response?.data?.error||'Error al guardar');}
    finally{setSaving(false);}
  };

  if(loading)return <div style={{padding:40}}><p style={{color:'#888'}}>Cargando…</p></div>;

  return (
    <div style={{padding:'24px 20px',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <h1 style={{margin:'0 0 24px',fontSize:22,fontWeight:700,color:'#1a2035'}}>Mi empresa</h1>
      <div style={{background:'#fff',borderRadius:12,padding:'28px 32px',boxShadow:'0 1px 4px rgba(0,0,0,.07)',maxWidth:600}}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 20px',marginBottom:20}}>
            {[['RazonSocial','Razón social *','1 / -1'],['RFC','RFC *'],['Email','Email de contacto *'],['Telefono','Teléfono']].map(([name,label,col])=>(
              <div key={name} style={{gridColumn:col||undefined}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>{label}</label>
                <input {...register(name)} style={{width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} />
              </div>
            ))}
            <div style={{gridColumn:'1 / -1'}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#4a5568',marginBottom:4}}>Dirección</label>
              <textarea {...register('Direccion')} style={{width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit',minHeight:70,resize:'vertical'}} />
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="submit" disabled={saving} style={{padding:'10px 24px',background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              {saving?'Guardando…':'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
