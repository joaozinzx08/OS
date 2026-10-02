import { useEffect, useState, useId, cloneElement, isValidElement, Children } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Inbox } from 'lucide-react';
import { api } from '../services/api';
export const roleNames = { administrador_principal: 'Administrador principal', administrador_setor: 'Administrador de setor', gestor: 'Gestor', colaborador: 'Colaborador' };
export const statuses = ['Aberta','Em atendimento','Concluída','Cancelada'];
export const priorities = ['Baixa','Média','Alta','Urgente'];
export const date = v => v ? new Intl.DateTimeFormat('pt-BR',{ dateStyle: 'short', timeStyle: 'short' }).format(new Date(v)) : 'Não definido';
export function Badge({ value }) { const classes = { 'Aberta':'blue', 'Em atendimento':'amber', 'Concluída':'green', 'Cancelada':'gray', 'Alta':'amber', 'Urgente':'red', 'Média':'gray', 'Baixa':'gray' }; return <span className={'badge '+(classes[value] || 'gray')}>{value}</span>; }
export function ErrorMessage({ message }) { return message ? <div className="notice error" role="alert"><AlertCircle size={18}/><span>{message}</span></div> : null; }
export function Success({ children }) { return children ? <div className="notice success" role="status">{children}</div> : null; }
export function Empty({ title = 'Nenhum registro por aqui', text = 'Os registros aparecerão neste espaço.' }) { return <div className="empty"><Inbox size={32}/><h3>{title}</h3><p>{text}</p></div>; }
export function Loading() { return <div className="loading" role="status"><span className="spinner"/>Carregando...</div>; }
export function Heading({ eyebrow, title, text, children }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{text && <p>{text}</p>}</div>{children && <div>{children}</div>}</div>; }
export function Field({ label, children, hint }) {
  const id = useId();
  function bind(child) {
    if (!isValidElement(child)) return child;
    if (['input','select','textarea'].includes(child.type)) return cloneElement(child, { id, 'aria-describedby': hint ? id+'-hint' : undefined });
    if (child.props.children) return cloneElement(child, {}, Children.map(child.props.children, bind));
    return child;
  }
  return <div className="field"><label htmlFor={id}>{label}</label>{Children.map(children,bind)}{hint && <small id={id+'-hint'}>{hint}</small>}</div>;
}
export function Pager({ data, setPage }) { if (!data || data.total <= data.limit) return null; return <div className="pager"><span>{data.total} registros · Página {data.page} de {Math.ceil(data.total/data.limit)}</span><div><button className="btn secondary" disabled={data.page <= 1} onClick={() => setPage(data.page-1)}><ArrowLeft size={16}/>Anterior</button><button className="btn secondary" disabled={data.page*data.limit >= data.total} onClick={() => setPage(data.page+1)}>Próxima<ArrowRight size={16}/></button></div></div>; }
export function useResource(path) {
  const [data,setData] = useState(null), [error,setError] = useState(''), [loading,setLoading] = useState(true), [version,setVersion] = useState(0);
  useEffect(() => { let alive = true; setLoading(true); setError(''); api(path).then(d => { if(alive) setData(d); }).catch(e => { if(alive) setError(e.message); }).finally(() => { if(alive) setLoading(false); }); return () => { alive = false; }; }, [path,version]);
  return { data,error,loading,reload: () => setVersion(v=>v+1) };
}
export function ResourceState({ resource, children }) { if(resource.loading) return <Loading/>; if(resource.error) return <><ErrorMessage message={resource.error}/><button className="btn secondary" onClick={resource.reload}>Tentar novamente</button></>; return children; }
