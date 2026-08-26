import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authAdmin } from '@/services/api';

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, { message: 'No coinciden', path: ['password_confirm'] });

export default function ResetPasswordAdmin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [estado, setEstado] = useState('validando'); // validando | valido | invalido
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token || !email) { setEstado('invalido'); return; }
    authAdmin.validarToken({ token, email })
      .then(r => setEstado(r.data.valido ? 'valido' : 'invalido'))
      .catch(() => setEstado('invalido'));
  }, [token, email]);

  const onSubmit = async (data) => {
    setLoading(true); setApiErr('');
    try {
      await authAdmin.confirmarReset({ token, email, password: data.password });
      toast.success('Contraseña restablecida');
      navigate('/login');
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Error al restablecer contraseña');
    } finally { setLoading(false); }
  };

  const inp = { width:'100%',padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,boxSizing:'border-box',fontFamily:'inherit' };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a2035,#2d3748)',fontFamily:"'Inter','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 32px',width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        {estado === 'validando' && (
          <p style={{textAlign:'center',color:'#718096',fontSize:14}}>Validando enlace…</p>
        )}

        {estado === 'invalido' && (
          <>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:8}}>⚠️</div>
              <h1 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#1a2035'}}>Enlace inválido o expirado</h1>
              <p style={{margin:0,color:'#718096',fontSize:13}}>Solicita un nuevo enlace para restablecer tu contraseña.</p>
            </div>
            <button onClick={() => navigate('/solicitar-reset')} style={{width:'100%',padding:12,background:'#1a2035',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              Solicitar nuevo enlace
            </button>
          </>
        )}

        {estado === 'valido' && (
          <>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:8}}>🔐</div>
              <h1 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#1a2035'}}>Nueva contraseña</h1>
              <p style={{margin:0,color:'#718096',fontSize:13}}>Crea una nueva contraseña para tu cuenta.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              {[['password','Nueva contraseña *'],['password_confirm','Confirmar contraseña *']].map(([name,label]) => (
                <div key={name} style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a5568',marginBottom:5}}>{label}</label>
                  <input {...register(name)} type="password" style={inp} />
                  {errors[name] && <p style={{color:'#e53e3e',fontSize:12,marginTop:4}}>{errors[name].message}</p>}
                </div>
              ))}
              {apiErr && <div style={{background:'#fff5f5',border:'1px solid #feb2b2',borderRadius:8,padding:'10px 14px',color:'#c53030',fontSize:13,marginBottom:14}}>{apiErr}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#3182ce',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
                {loading ? 'Guardando…' : 'Restablecer contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}