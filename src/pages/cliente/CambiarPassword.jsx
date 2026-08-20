import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema=z.object({password_actual:z.string().min(1,'Requerida'),password_nueva:z.string().min(8,'Mínimo 8 caracteres'),password_confirm:z.string()}).refine(d=>d.password_nueva===d.password_confirm,{message:'No coinciden',path:['password_confirm']});

export default function CambiarPassword() {
  const navigate=useNavigate();const {cliente,setAuth,clearAuth,mustChange}=useClienteStore();
  const [loading,setLoading]=useState(false);const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{
      await authCliente.cambiarPass({password_actual:data.password_actual,password_nueva:data.password_nueva});
      toast.success('Contraseña actualizada');
      if(mustChange){const s=useClienteStore.getState();setAuth(s.token,cliente,false);}
      navigate('/portal/estado-cuenta');
    }catch(err){setApiErr(err.response?.data?.error||'Error al cambiar contraseña');}
    finally{setLoading(false);}
  };

  const inp={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ebf8ff,#bee3f8)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:420,boxShadow:'0 10px 40px rgba(0,0,0,.12)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🔐</div>
          <h1 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#1a2035'}}>{mustChange?'Crea tu contraseña':'Cambiar contraseña'}</h1>
          <p style={{margin:0,color:'#718096',fontSize:13}}>{mustChange?'Por seguridad, crea una contraseña personal antes de continuar.':'Ingresa tu contraseña actual y la nueva.'}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {[['password_actual',mustChange?'Contraseña temporal (la que usaste para entrar)':'Contraseña actual *'],['password_nueva','Nueva contraseña *'],['password_confirm','Confirmar nueva contraseña *']].map(([name,label])=>(
            <div key={name} style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>{label}</label>
              <input {...register(name)} type="password" style={inp}/>
              {errors[name]&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors[name].message}</p>}
            </div>
          ))}
          {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer',marginBottom:8}}>{loading?'Guardando…':'Guardar nueva contraseña'}</button>
          {!mustChange&&<button type="button" style={{width:'100%',padding:10,background:'#fff',color:'#4a5568',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,cursor:'pointer'}} onClick={()=>navigate('/portal/estado-cuenta')}>Cancelar</button>}
          {mustChange&&<p style={{textAlign:'center',marginTop:12,fontSize:13}}><button type="button" style={{background:'none',border:'none',color:'#a0aec0',fontSize:13,cursor:'pointer',textDecoration:'underline'}} onClick={()=>{clearAuth();navigate('/portal/login');}}>Cerrar sesión</button></p>}
        </form>
      </div>
    </div>
  );
}
