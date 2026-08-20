import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/authStore';
import { authAdmin } from '@/services/api';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/dashboard',       icon:'⊞', label:'Dashboard' },
  { to:'/clientes',        icon:'👤', label:'Clientes' },
  { to:'/productos',       icon:'📦', label:'Productos' },
  { to:'/financiamientos', icon:'📋', label:'Financiamientos' },
  { to:'/empresa',         icon:'🏢', label:'Mi empresa' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAdminStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (document.getElementById('admin-mq')) return;
    const s = document.createElement('style');
    s.id = 'admin-mq';
    s.textContent = `
      @media(max-width:768px){
        .adm-bar{display:flex!important}
        .adm-sidebar{position:fixed!important;top:0;left:0;bottom:0;transform:translateX(-100%);box-shadow:4px 0 24px rgba(0,0,0,.2)}
        .adm-sidebar.open{transform:translateX(0)}
        .adm-close{display:block!important}
        .adm-overlay{display:block!important}
        .adm-main{padding-top:56px}
      }`;
    document.head.appendChild(s);
  }, []);

  const logout = async () => {
    try { await authAdmin.logout(); } catch(_) {}
    clearAuth(); navigate('/login'); toast.success('Sesión cerrada');
  };

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:"'Inter','Segoe UI',sans-serif",background:'#f4f6f9'}}>
      {/* Barra móvil */}
      <header className="adm-bar" style={{display:'none',alignItems:'center',justifyContent:'space-between',position:'fixed',top:0,left:0,right:0,height:56,background:'#1a2035',padding:'0 12px',zIndex:50,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}>
        <button style={{width:40,height:40,border:'none',background:'transparent',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setOpen(v=>!v)}>{open?'✕':'☰'}</button>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:20}}>💳</span><span style={{color:'#fff',fontWeight:700,fontSize:16}}>PagosApp</span></div>
        <div style={{width:40}}/>
      </header>

      {/* Overlay */}
      <div className="adm-overlay" style={{display:'none',position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:40}} onClick={()=>setOpen(false)}/>

      {/* Sidebar */}
      <aside className={`adm-sidebar${open?' open':''}`} style={{width:240,minHeight:'100vh',background:'#1a2035',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0,transition:'transform .25s ease',zIndex:45}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'24px 20px 20px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:24}}>💳</span>
          <span style={{color:'#fff',fontWeight:700,fontSize:18}}>PagosApp</span>
          <button className="adm-close" style={{display:'none',marginLeft:'auto',background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:18,cursor:'pointer'}} onClick={()=>setOpen(false)}>✕</button>
        </div>
        <nav style={{flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:4,overflowY:'auto'}}>
          {NAV.map(item=>(
            <NavLink key={item.to} to={item.to} style={({isActive})=>({display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,color:isActive?'#63b3ed':'rgba(255,255,255,.6)',background:isActive?'rgba(99,179,237,.15)':'transparent',textDecoration:'none',fontSize:14,fontWeight:500,transition:'all .15s'})}>
              <span style={{fontSize:16,width:20,textAlign:'center'}}>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{padding:'16px 12px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'#3182ce',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>
              {(user?.nombre||'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{color:'#fff',fontSize:13,fontWeight:600,lineHeight:1.3}}>{user?.nombre||'Admin'}</div>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:11}}>{user?.tenant_key}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%',padding:'8px 0',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,color:'rgba(255,255,255,.6)',fontSize:13,cursor:'pointer'}}>Salir</button>
        </div>
      </aside>

      <main className="adm-main" style={{flex:1,overflow:'auto',minWidth:0}}><Outlet /></main>
    </div>
  );
}
