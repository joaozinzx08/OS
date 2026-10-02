import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Heading, ResourceState, useResource, statuses, priorities, Pager } from '../components/ui';
import OrdersTable from '../components/OrdersTable';
export default function OrdersPage() {
  const [q,setQ] = useState(''), [search,setSearch] = useState(''), [status,setStatus] = useState(''), [priority,setPriority] = useState(''), [page,setPage] = useState(1);
  const resource = useResource('/ordens?'+new URLSearchParams({ q:search,status,prioridade:priority,page,limit:10 }));
  return <><Heading eyebrow="ATENDIMENTO" title="Ordens de serviço" text="Consulte a fila de ordens e acompanhe status, prioridade e evolução de cada atendimento."><Link className="btn primary" to="/ordens/nova"><Plus size={18}/>Nova ordem</Link></Heading><section className="panel"><div className="filters"><form className="search-form" onSubmit={e=>{e.preventDefault();setSearch(q);setPage(1);}}><Search size={18}/><input aria-label="Buscar por título ou protocolo" placeholder="Busque por título ou protocolo" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn secondary">Buscar</button></form><select aria-label="Filtrar status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Todos os status</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><select aria-label="Filtrar prioridade" value={priority} onChange={e=>{setPriority(e.target.value);setPage(1);}}><option value="">Todas as prioridades</option>{priorities.map(s=><option key={s}>{s}</option>)}</select></div><ResourceState resource={resource}><OrdersTable items={resource.data?.items}/><Pager data={resource.data} setPage={setPage}/></ResourceState></section></>;
}
