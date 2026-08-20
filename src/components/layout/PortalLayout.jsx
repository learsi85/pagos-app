import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useClienteStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/portal/estado-cuenta',   icon:'📊', label:'Estado de cuenta' },
  { to:'/portal/financiamientos', icon:'📋', label:'Mis financiamientos' },
];

export default function PortalLayout() {
  const { cliente, clearAuth } = useClienteStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (document.getElementById('portal-mq')) return;
    const s = document.createElement('style');
    s.id = 'portal-mq';
    s.textContent = `
      @media(max-width:768px){
        .ptl-hamburger{display:flex!important}
        .ptl-nav{display:none!important}
        .ptl-nav.open{display:flex!important;flex-direction:column;position:absolute;top:56px;left:0;right:0;background:#1a2035;padding:8px 16px 16px;box-shadow:0 4px 12px rgba(0,0,0,.25);gap:4px;z-index:99}
        .ptl-username{display:none!important}
        .ptl-topbar{padding:0 16px!important;gap:12px!important}
      }`;
    document.head.appendChild(s);
  }, []);

  const logout = () => { clearAuth(); navigate('/portal/login'); toast.success('Sesión cerrada'); };

  return (
    <div style={{minHeight:'100vh',background:'#f4f6f9',fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <header className="ptl-topbar" style={{display:'flex',alignItems:'center',gap:32,padding:'0 32px',height:56,background:'#1a2035',boxShadow:'0 2px 8px rgba(0,0,0,.2)',position:'sticky',top:0,zIndex:100}}>
        <button className="ptl-hamburger" style={{display:'none',width:40,height:40,border:'none',background:'transparent',color:'#fff',fontSize:20,cursor:'pointer',alignItems:'center',justifyContent:'center',flexShrink:0}} onClick={()=>setOpen(v=>!v)}>
          {open?'✕':'☰'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontSize:20}}>💳</span>
          <span style={{color:'#fff',fontWeight:700,fontSize:16,whiteSpace:'nowrap'}}>Mi portal de pagos</span>
        </div>
        <nav className={`ptl-nav${open?' open':''}`} style={{display:'flex',gap:4,flex:1}}>
          {NAV.map(item=>(
            <NavLink key={item.to} to={item.to} style={({isActive})=>({display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:6,color:isActive?'#63b3ed':'rgba(255,255,255,.6)',background:isActive?'rgba(99,179,237,.15)':'transparent',textDecoration:'none',fontSize:14,fontWeight:500,transition:'all .15s'})}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:12,marginLeft:'auto',flexShrink:0}}>
          <span className="ptl-username" style={{color:'rgba(255,255,255,.8)',fontSize:13,whiteSpace:'nowrap'}}>{cliente?.nombre||'Cliente'}</span>
          <button onClick={logout} style={{padding:'5px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:6,color:'#fff',fontSize:13,cursor:'pointer',whiteSpace:'nowrap'}}>Salir</button>
        </div>
      </header>
      <main style={{padding:'32px 20px'}}><Outlet /></main>
    </div>
  );
}
