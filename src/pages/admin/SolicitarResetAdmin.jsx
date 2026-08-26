import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAdmin } from '@/services/api';

const schema = z.object({ email: z.string().email('Correo inválido') });

export default function SolicitarResetAdmin() {
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true); setApiErr('');
    try {
      await authAdmin.solicitarReset(data);
      setEnviado(true);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Error al enviar el correo');
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a2035,#2d3748)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>🔑</div>
          <h1 style={{margin:'0 0 4px',fontSize:22,fontWeight:700,color:'#1a2035'}}>Recuperar contraseña</h1>
          <p style={{margin:0,color:'#718096',fontSize:13}}>Te enviaremos un enlace a tu correo de administrador.</p>
        </div>

        {enviado ? (
          <div style={{background:'#f0fff4',border:'1px solid #9ae6b4',borderRadius:8,padding:'14px 16px',color:'#276749',fontSize:14,textAlign:'center'}}>
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>Correo</label>
              <input {...register('email')} type="email" style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box'}} autoComplete="email" />
              {errors.email && <p style={{color:'#e53e3e',fontSize:12,marginTop:3}}>{errors.email.message}</p>}
            </div>
            {apiErr && <div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
            <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'#718096'}}>
          <a href="/login" style={{color:'#3182ce'}}>Volver a iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}