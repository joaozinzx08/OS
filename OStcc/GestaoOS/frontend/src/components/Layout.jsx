import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Layers, LayoutDashboard, ClipboardList, Users, Building2, Tags, Bell, ShieldCheck, LogOut, Menu, X, UserRound, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleNames, ErrorMessage } from './ui';
const navigation = [
  ['/painel', 'Visão geral', LayoutDashboard], ['/ordens','Ordens de serviço',ClipboardList], ['/notificacoes','Notificações',Bell],
  ['/usuarios','Usuários',Users,['administrador_principal','administrador_setor']],
  ['/setores','Setores',Building2,['administrador_principal']], ['/categorias','Categorias',Tags,['administrador_principal']],
  ['/auditoria','Auditoria',ShieldCheck,['administrador_principal']]
];
export default function Layout() {
  const { usuario, empresa, logout } = useAuth(); const [open,setOpen] = useState(false), [error,setError] = useState(''); const navigate = useNavigate();
  async function leave() { try { await logout(); navigate('/login'); } catch(e) { setError(e.message); } }
  return <div className="app-shell">
    {open && <button className="sidebar-backdrop" aria-label="Fechar navegação" onClick={() => setOpen(false)}/>}
    <aside className={'sidebar '+(open?'is-open':'')}>
      <NavLink className="brand" to="/painel"><span className="brand-mark"><Layers size={22}/></span>Gestão<span className="brand-os">OS</span></NavLink>
      <button className="icon-button close-sidebar" aria-label="Fechar menu" onClick={() => setOpen(false)}><X/></button>
      <div className="workspace-label">ÁREA DE TRABALHO</div>
      <div className="company-block"><span className="company-icon"><Building2 size={18}/></span><div><strong>{empresa.nome}</strong><small>Gestão de serviços</small></div></div>
      <div className="nav-label">PRINCIPAL</div>
      <nav>{navigation.filter(([, , ,roles]) => !roles || roles.includes(usuario.role)).map(([to,label,Icon]) => <NavLink key={to} end={to==='/painel'} to={to} onClick={() => setOpen(false)}><Icon size={19}/>{label}</NavLink>)}</nav>
      <div className="sidebar-note"><span className="status-dot"/>Fluxo centralizado.<p>Organize ordens.<br/>Acompanhe atendimentos.</p><ArrowUpRight size={22}/></div>
      <div className="sidebar-bottom"><NavLink to="/perfil" className="profile-link" onClick={() => setOpen(false)}><span className="avatar">{usuario.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span><strong>{usuario.nome}</strong><small>{roleNames[usuario.role]}</small></span></NavLink><button className="icon-button" title="Sair" aria-label="Sair" onClick={leave}><LogOut size={18}/></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu/></button><span className="topbar-label">Empresa <span>/</span> <strong>{empresa.nome}</strong></span></div><NavLink className="topbar-profile" to="/perfil"><UserRound size={17}/>Minha conta</NavLink></header><main><ErrorMessage message={error}/><Outlet/></main><footer>GestãoOS <span>Gestão de ordens de serviço empresarial.</span></footer></div>
  </div>;
}
