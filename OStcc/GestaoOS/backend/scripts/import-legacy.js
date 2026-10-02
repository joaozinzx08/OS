import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { migrate } from '../src/database/migrate.js';
import { db, write } from '../src/database/connection.js';
import { Empresa, Setor, Categoria, Usuario, Ordem, Historico, Notificacao, Auditoria } from '../src/models/index.js';
import { roles, statuses, priorities } from '../src/services/shared.js';
// Importação explícita e atômica. A origem nunca é modificada.
const source = process.argv[2];
try {
 if(!source) throw new Error('Uso: npm run db:import -w backend -- CAMINHO_ABSOLUTO_DO_DB_JSON');
 const legacy=JSON.parse(fs.readFileSync(path.resolve(source),'utf8'));
 for(const key of ['empresas','usuarios','setores','categorias','ordensServico']) if(!Array.isArray(legacy[key])) throw new Error('Coleção ausente: '+key);
 await migrate();
 await write(async transaction=>{
  if(await Empresa.count({transaction})) throw new Error('Importe somente em um banco vazio, antes de criar o administrador.');
  const opts={transaction};
  const times=(created,updated)=>{const c=new Date(created||Date.now()),u=new Date(updated||created||Date.now());if(Number.isNaN(c.valueOf())||Number.isNaN(u.valueOf()))throw new Error('Data inválida no arquivo legado.');return {createdAt:c,updatedAt:u};};
  const checked=new Map();
  for(const c of legacy.empresas) await Empresa.create({id:c.id,nome:c.nome,email:c.email.toLowerCase(),ativo:c.ativo!==false,...times(c.dataCriacao)},opts);
  for(const s of legacy.setores) await Setor.create({id:s.id,empresaId:s.empresaId,nome:s.nome,descricao:s.descricao||'',ativo:s.ativo!==false,...times(s.dataCriacao)},opts);
  for(const c of legacy.categorias){const key=c.empresaId+'|'+c.nome;if(checked.has(key))continue;await Categoria.create({id:c.id,empresaId:c.empresaId,nome:c.nome},opts);checked.set(key,c.id);}
  const fallbackSectors=new Map();
  for(const u of legacy.usuarios){
   if(!roles.includes(u.role)||!/^\$2[aby]\$/.test(u.senha))throw new Error('Perfil ou hash de senha inválido em usuário do legado.');
   let setorId=u.setorId||null;
   if(!setorId&&u.role!=='administrador_principal'){
    if(!fallbackSectors.has(u.empresaId)){let s=await Setor.findOne({where:{empresaId:u.empresaId,nome:'Geral'},transaction});if(!s)s=await Setor.create({empresaId:u.empresaId,nome:'Geral',descricao:'Setor provisório para revisão após importação.'},opts);fallbackSectors.set(u.empresaId,s.id);}setorId=fallbackSectors.get(u.empresaId);
   }
   await Usuario.create({id:u.id,empresaId:u.empresaId,setorId,nome:u.nome,email:u.email.trim().toLowerCase(),senhaHash:u.senha,role:u.role,ativo:u.ativo!==false,...times(u.dataCriacao)},opts);
  }
  for(const o of legacy.ordensServico){
   if(!statuses.includes(o.status)||!priorities.includes(o.prioridade))throw new Error('Status ou prioridade sem correspondência no legado.');
   const categoryName=o.categoria||'Geral';const key=o.empresaId+'|'+categoryName;
   if(!checked.has(key)){const c=await Categoria.create({empresaId:o.empresaId,nome:categoryName},opts);checked.set(key,c.id);}
   const deadline=o.prazo?new Date(o.prazo):null;if(deadline&&Number.isNaN(deadline.valueOf()))throw new Error('Prazo inválido no legado.');
   await Ordem.create({id:o.id,protocolo:'OS-LEG-'+o.id,empresaId:o.empresaId,solicitanteId:o.solicitanteId,setorResponsavelId:o.setorResponsavelId,categoriaId:checked.get(key),titulo:o.titulo,descricao:o.descricao,prioridade:o.prioridade,status:o.status,sigilo:!!o.sigilo,prazo:deadline,dataConclusao:o.dataConclusao||null,...times(o.dataAbertura,o.dataAtualizacao)},opts);
  }
  for(const h of legacy.historico||[]) await Historico.create({id:h.id||randomUUID(),empresaId:h.empresaId,ordemId:h.ordemId,usuarioId:h.usuarioId,acao:h.acao,descricao:h.descricao,...times(h.data)},opts);
  for(const n of legacy.notificacoes||[]) await Notificacao.create({id:n.id||randomUUID(),empresaId:n.empresaId,usuarioId:n.usuarioId,ordemId:null,titulo:n.titulo,mensagem:n.mensagem,lida:!!n.lida,...times(n.data)},opts);
  for(const a of legacy.auditoria||[]) await Auditoria.create({id:a.id||randomUUID(),empresaId:a.empresaId,usuarioId:a.usuarioId,acao:a.acao,detalhes:typeof a.detalhes==='string'?a.detalhes:JSON.stringify(a.detalhes||{}),...times(a.data)},opts);
 });
 console.log('Importação concluída: empresas, setores, categorias, usuários, ordens, histórico, notificações e auditoria.');
 console.log('Senhas preservadas. Revise usuários movidos para Geral. Chats, anexos, preferências e demais campos continuam no legado; não foram migrados.');
} catch(error){console.error('Importação cancelada sem importação parcial:',error.message);process.exitCode=1;}
finally{await db.close();}
