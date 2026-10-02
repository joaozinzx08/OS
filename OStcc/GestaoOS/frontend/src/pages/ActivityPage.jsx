import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check,ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { Heading,ResourceState,useResource,Pager,Empty,date,ErrorMessage } from '../components/ui';
export default function ActivityPage({audit=false}){
 const [page,setPage]=useState(1),[error,setError]=useState(''),[busy,setBusy]=useState(null);const resource=useResource((audit?'/auditoria':'/notificacoes')+'?page='+page+'&limit=20');
 async function read(id){setBusy(id);setError('');try{await api('/notificacoes/'+id+'/lida',{method:'PATCH'});resource.reload();}catch(e){setError(e.message);}finally{setBusy(null);}}
 return <><Heading eyebrow={audit?'RASTREABILIDADE':'ATUALIZAÇÕES'} title={audit?'Registro de auditoria':'Suas notificações'} text={audit?'Ações registradas na sua empresa, em ordem cronológica.':'Acompanhe novidades sobre solicitações e atendimentos.'}/><ErrorMessage message={error}/><section className="panel"><ResourceState resource={resource}>{resource.data?.items.length?<div className="activity-list">{resource.data.items.map(item=><article key={item.id}><span className={'activity-dot '+(!audit&&!item.lida?'unread':'')}/><div><strong>{audit?item.acao:item.titulo}</strong><p>{audit?item.detalhes:item.mensagem}</p><small>{date(item.createdAt)}{audit?' · Usuário: '+item.usuarioId:''}</small></div>{!audit&&<div className="activity-actions">{item.ordemId&&<Link className="icon-button" title="Abrir ordem" aria-label="Abrir ordem" to={'/ordens/'+item.ordemId}><ArrowUpRight size={18}/></Link>}{!item.lida&&<button className="icon-button" aria-label="Marcar como lida" title="Marcar como lida" disabled={busy===item.id} onClick={()=>read(item.id)}><Check size={18}/></button>}</div>}</article>)}</div>:<Empty title={audit?'Nenhuma ação registrada':'Nenhuma notificação'} text="As atualizações aparecerão aqui."/>}<Pager data={resource.data} setPage={setPage}/></ResourceState></section></>;
}
