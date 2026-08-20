import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authCliente } from '@/services/api';

const schema=z.object({email:z.string().email('Ingresa un email válido')});

export default function OlvidePassword() {
  const [enviado,setEnviado]=useState(false);const [loading,setLoading]=useState(false);const [apiErr,setApiErr]=useState('');
  const {register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema)});

  const onSubmit=async(data)=>{
    setLoading(true);setApiErr('');
    try{await authCliente.solicitarReset(data);setEnviado(true);}
    catch(err){setApiErr(err.response?.data?.error||'Ocurrió un error. Intenta de nuevo.');}
    finally{setLoading(false);}
  };

  const inp={width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ebf8ff,#bee3f8)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:400,boxShadow:'0 10px 40px rgba(0,0,0,.12)',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>🔒</div>
        <h1 style={{margin:'0 0 8px',fontSize:20,fontWeight:700,color:'#1a2035'}}>¿Olvidaste tu contraseña?</h1>
        {enviado?(
          <>
            <div style={{fontSize:40,margin:'16px 0 12px'}}>📧</div>
            <p style={{color:'#4a5568',fontSize:15,lineHeight:1.6}}>Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en breve.</p>
            <p style={{color:'#718096',fontSize:13}}>Revisa también tu carpeta de spam.</p>
            <Link to="/portal/login" style={{color:'#3182ce',fontSize:14}}>← Regresar al login</Link>
          </>
        ):(
          <>
            <p style={{margin:'0 0 24px',color:'#718096',fontSize:14,lineHeight:1.5,textAlign:'left'}}>Ingresa el correo con el que accedes a tu portal y te enviaremos un enlace para crear una nueva contraseña.</p>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{marginBottom:16,textAlign:'left'}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Correo electrónico</label>
                <input {...register('email')} type="email" placeholder="tu@correo.com" style={inp} autoFocus/>
                {errors.email&&<p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors.email.message}</p>}
              </div>
              {apiErr&&<div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14,textAlign:'left'}}>{apiErr}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>{loading?'Enviando…':'Enviar enlace'}</button>
            </form>
            <p style={{marginTop:20,fontSize:13}}><Link to="/portal/login" style={{color:'#3182ce'}}>← Regresar al login</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
