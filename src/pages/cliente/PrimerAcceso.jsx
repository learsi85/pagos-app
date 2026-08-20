import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema=z.object({password:z.string().min(8,'Mínimo 8 caracteres'),passwordConfirm:z.string()}).refine(d=>d.password===d.passwordConfirm,{message:'Las contraseñas no coinciden',path:['passwordConfirm']});

export default function PrimerAcceso() {
  const navigate=useNavigate();const [params]=useSearchParams();
  const token=params.get('token')||'';const email=params.get('email')||'';
  const setAuth=useClienteStore(s=>s.setAuth);
  const [loading,setLoading]=useState(false);const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  useEffect(()=>{if(!token||!email)setApiErr('Enlace de activación inválido o incompleto.');},[]);

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{const r=await authCliente.primerAcceso({token,email,password:data.password});setAuth(r.data.token,{email},false);navigate('/portal/estado-cuenta');}
    catch(err){setApiErr(err.response?.data?.error||'Error al activar cuenta');}
    finally{setLoading(false);}
  };

  const inp={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ebf8ff,#bee3f8)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:400,boxShadow:'0 10px 40px rgba(0,0,0,.12)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🔑</div>
          <h1 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#1a2035'}}>Activa tu cuenta</h1>
          <p style={{margin:0,color:'#718096',fontSize:13}}>Crea tu contraseña para acceder al portal</p>
        </div>
        {email&&<div style={{background:'#ebf8ff',border:'1px solid #bee3f8',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#2b6cb0',marginBottom:20}}>Cuenta: <strong>{email}</strong></div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          {[['password','Nueva contraseña *','Mínimo 8 caracteres'],['passwordConfirm','Confirmar contraseña *','Repite la contraseña']].map(([name,label,ph])=>(
            <div key={name} style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>{label}</label>
              <input {...register(name)} type="password" placeholder={ph} style={inp}/>
              {errors[name]&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors[name].message}</p>}
            </div>
          ))}
          {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
          <button type="submit" disabled={loading||!token||!email} style={{width:'100%',padding:12,marginTop:4,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>{loading?'Activando…':'Activar mi cuenta'}</button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:12}}><Link to="/portal/login" style={{color:'#3182ce'}}>← Regresar al login</Link></p>
      </div>
    </div>
  );
}
