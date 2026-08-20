import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';

const schema=z.object({password:z.string().min(8,'Mínimo 8 caracteres'),passwordConfirm:z.string()}).refine(d=>d.password===d.passwordConfirm,{message:'No coinciden',path:['passwordConfirm']});

export default function ResetPassword() {
  const navigate=useNavigate();const [params]=useSearchParams();
  const token=params.get('token')||'';const email=params.get('email')||'';
  const [estado,setEstado]=useState('validando');const [nombre,setNombre]=useState('');
  const [loading,setLoading]=useState(false);const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  useEffect(()=>{
    if(!token||!email){setEstado('invalido');return;}
    authCliente.validarToken({token,email}).then(r=>{if(r.data.valido){setNombre(r.data.nombre||'');setEstado('valido');}else{setEstado('invalido');}}).catch(()=>setEstado('invalido'));
  },[]);

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{await authCliente.confirmarReset({token,email,password:data.password});setEstado('exito');setTimeout(()=>navigate('/portal/login'),2500);}
    catch(err){setApiErr(err.response?.data?.error||'Error. Intenta de nuevo.');}
    finally{setLoading(false);}
  };

  const inp={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit'};
  const shell={minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ebf8ff,#bee3f8)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16};
  const card={background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:400,boxShadow:'0 10px 40px rgba(0,0,0,.12)',textAlign:'center'};

  if(estado==='validando')return <div style={shell}><div style={card}><p style={{color:'#718096'}}>Verificando enlace…</p></div></div>;
  if(estado==='invalido')return <div style={shell}><div style={card}><div style={{fontSize:48,marginBottom:12}}>⛔</div><h2 style={{margin:'0 0 8px',color:'#1a2035'}}>Enlace inválido o expirado</h2><p style={{color:'#718096',fontSize:14}}>Solicita uno nuevo desde el login.</p><Link to="/portal/olvide-password" style={{display:'inline-block',padding:'10px 24px',background:'#3182ce',color:'#fff',borderRadius:8,fontSize:14,fontWeight:600,textDecoration:'none',marginBottom:12}}>Solicitar nuevo enlace</Link><p><Link to="/portal/login" style={{color:'#3182ce',fontSize:13}}>← Login</Link></p></div></div>;
  if(estado==='exito')return <div style={shell}><div style={card}><div style={{fontSize:48,marginBottom:12}}>✅</div><h2 style={{margin:'0 0 8px',color:'#1a2035'}}>¡Contraseña restablecida!</h2><p style={{color:'#718096',fontSize:14}}>Redirigiendo al login…</p></div></div>;

  return (
    <div style={shell}>
      <div style={{...card,textAlign:'left'}}>
        <div style={{textAlign:'center',marginBottom:24}}><div style={{fontSize:40,marginBottom:8}}>🔑</div><h1 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#1a2035'}}>Nueva contraseña</h1>{nombre&&<p style={{margin:0,color:'#718096',fontSize:13}}>Hola <strong>{nombre}</strong></p>}</div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {[['password','Nueva contraseña *'],['passwordConfirm','Confirmar contraseña *']].map(([name,label])=>(
            <div key={name} style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>{label}</label>
              <input {...register(name)} type="password" style={inp} autoFocus={name==='password'}/>
              {errors[name]&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors[name].message}</p>}
            </div>
          ))}
          {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>{loading?'Guardando…':'Guardar nueva contraseña'}</button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:13}}><Link to="/portal/login" style={{color:'#3182ce'}}>← Regresar al login</Link></p>
      </div>
    </div>
  );
}
