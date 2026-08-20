import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';
import { useClienteStore } from '@/store/authStore';

const schema=z.object({email:z.string().email('Email inválido'),password:z.string().min(1,'Requerida')});

export default function LoginCliente() {
  const navigate=useNavigate();const setAuth=useClienteStore(s=>s.setAuth);
  const [loading,setLoading]=useState(false);const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{
      const r=await authCliente.login(data);setAuth(r.data.token,r.data.cliente,r.data.must_change);
      navigate(r.data.must_change?'/portal/cambiar-password':'/portal/estado-cuenta');
    }catch(err){
      const code=err.response?.data?.code;
      setApiErr(code==='PRIMER_ACCESO'?'Tu cuenta no ha sido activada. Usa el enlace de activación que te enviaron.':err.response?.data?.error||'Credenciales incorrectas');
    }finally{setLoading(false);}
  };

  const inp={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ebf8ff,#bee3f8)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:380,boxShadow:'0 10px 40px rgba(0,0,0,.12)',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>💳</div>
        <h1 style={{margin:'0 0 4px',fontSize:22,fontWeight:700,color:'#1a2035'}}>Portal del cliente</h1>
        <p style={{margin:'0 0 28px',color:'#718096',fontSize:13}}>Consulta tu estado de cuenta y plan de pagos</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{marginBottom:14,textAlign:'left'}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Correo electrónico</label>
            <input {...register('email')} type="email" placeholder="tu@correo.com" style={inp} autoComplete="email"/>
            {errors.email&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors.email.message}</p>}
          </div>
          <div style={{marginBottom:16,textAlign:'left'}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Contraseña</label>
            <input {...register('password')} type="password" placeholder="••••••••" style={inp} autoComplete="current-password"/>
            {errors.password&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors.password.message}</p>}
          </div>
          {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14,textAlign:'left'}}>{apiErr}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>{loading?'Entrando…':'Iniciar sesión'}</button>
        </form>
        <p style={{marginTop:16,fontSize:13,color:'#718096'}}><Link to="/portal/olvide-password" style={{color:'#3182ce'}}>¿Olvidaste tu contraseña?</Link></p>
        <p style={{marginTop:10,fontSize:13,color:'#718096'}}>¿Primera vez? <Link to="/portal/acceso" style={{color:'#3182ce'}}>Activa tu cuenta</Link></p>
        <p style={{marginTop:16,fontSize:12}}><Link to="/login" style={{color:'#a0aec0'}}>← Acceso administrativo</Link></p>
      </div>
    </div>
  );
}
