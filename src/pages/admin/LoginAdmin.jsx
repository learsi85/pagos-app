import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authAdmin } from '@/services/api';
import { useAdminStore } from '@/store/authStore';

const schema = z.object({ usuario_key:z.string().min(1,'Requerido'), password:z.string().min(1,'Requerida') });

export default function LoginAdmin() {
  const navigate = useNavigate();
  const setAuth  = useAdminStore((s)=>s.setAuth);
  const [loading,setLoading]=useState(false);
  const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{const r=await authAdmin.login(data);setAuth(r.data.token,r.data.user);toast.success(`Bienvenido, ${r.data.user.nombre}`);navigate('/dashboard');}
    catch(err){setApiErr(err.response?.data?.error||'Error al iniciar sesión');}
    finally{setLoading(false);}
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a2035,#2d3748)',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>💳</div>
          <h1 style={{margin:'0 0 4px',fontSize:24,fontWeight:700,color:'#1a2035'}}>PagosApp</h1>
          <p style={{margin:0,color:'#718096',fontSize:14}}>Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Usuario</label>
            <input {...register('usuario_key')} style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box'}} autoComplete="username" />
            {errors.usuario_key&&<p style={{color:'#e53e3e',fontSize:12,marginTop:3}}>{errors.usuario_key.message}</p>}
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Contraseña</label>
            <input {...register('password')} type="password" style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box'}} autoComplete="current-password" />
            {errors.password&&<p style={{color:'#e53e3e',fontSize:12,marginTop:3}}>{errors.password.message}</p>}
          </div>
          {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
            {loading?'Iniciando sesión…':'Iniciar sesión'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'#718096'}}>¿Eres cliente? <a href="/portal/login" style={{color:'#3182ce'}}>Accede a tu portal</a></p>
      </div>
    </div>
  );
}
