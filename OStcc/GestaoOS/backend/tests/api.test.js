import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'gestao-test-'));
process.env.DATABASE_PATH = path.join(temp,'test.sqlite');
process.env.JWT_SECRET = 'test-only-secret-never-use-in-production-000000';
process.env.FRONTEND_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
const { migrate } = await import('../src/database/migrate.js');
const { db,write } = await import('../src/database/connection.js');
const { Empresa,Setor,Categoria,Usuario,Ordem,Historico,Sessao } = await import('../src/models/index.js');
const { createApp } = await import('../src/app.js');
const app = createApp();
const password = 'Senha-teste-12345';
let company,otherCompany,sector,otherSector,foreignSector,category,foreignCategory,admin,sectorAdmin,manager,colleague,foreignUser,collaborator,order,otherOrder;
const cookies = {};
async function login(user) {const res = await request(app).post('/api/auth/login').send({email:user.email,senha:password});assert.equal(res.status,200,JSON.stringify(res.body));return res.headers['set-cookie'][0].split(';')[0];}
function auth(method,url,who='admin'){return request(app)[method](url).set('Cookie',cookies[who]).set('Origin','http://localhost:5173');}
before(async()=>{
 await migrate();await migrate();
 const hash=await bcrypt.hash(password,4);
 company=await Empresa.create({nome:'Empresa A',email:'empresa-a@test.invalid'});otherCompany=await Empresa.create({nome:'Empresa B',email:'empresa-b@test.invalid'});
 sector=await Setor.create({nome:'TI',empresaId:company.id});otherSector=await Setor.create({nome:'RH',empresaId:company.id});foreignSector=await Setor.create({nome:'TI',empresaId:otherCompany.id});
 category=await Categoria.create({nome:'Manutenção',empresaId:company.id});foreignCategory=await Categoria.create({nome:'Manutenção',empresaId:otherCompany.id});
 const user=async(name,role,setorId,empresaId=company.id)=>Usuario.create({nome:name,email:name+'@test.invalid',senhaHash:hash,role,setorId,empresaId});
 admin=await user('admin','administrador_principal',null);sectorAdmin=await user('sectorAdmin','administrador_setor',sector.id);manager=await user('manager','gestor',sector.id);collaborator=await user('collaborator','colaborador',sector.id);colleague=await user('colleague','colaborador',sector.id);foreignUser=await user('foreign','administrador_principal',foreignSector.id,otherCompany.id);
 for(const [name,u] of Object.entries({admin,sectorAdmin,manager,collaborator,colleague,foreignUser})) cookies[name]=await login(u);
});
after(async()=>{await db.close();fs.rmSync(temp,{recursive:true,force:true});});
test('rotas protegidas negam acesso anônimo',async()=>{assert.equal((await request(app).get('/api/ordens')).status,401);});
test('login rejeita senha incorreta e retorna cookie HttpOnly sem token no JSON',async()=>{
 const wrong=await request(app).post('/api/auth/login').send({email:admin.email,senha:'incorreta'});assert.equal(wrong.status,401);
 const result=await request(app).post('/api/auth/login').send({email:admin.email,senha:password});assert.match(result.headers['set-cookie'][0],/HttpOnly/);assert.match(result.headers['set-cookie'][0],/SameSite=Strict/);assert.equal(result.body.token,undefined);assert.equal(result.body.usuario.senhaHash,undefined);
});
test('cria ordem, histórico e dados persistentes no SQLite',async()=>{
 const res=await auth('post','/api/ordens','collaborator').send({titulo:'Computador não liga',descricao:'O computador da recepção não inicia.',setorResponsavelId:sector.id,categoriaId:category.id});assert.equal(res.status,201,JSON.stringify(res.body));order=res.body;
 assert.equal(await Ordem.count(),1);assert.equal(await Historico.count({where:{ordemId:order.id}}),1);
 const rows=await db.query('SELECT titulo FROM ordens WHERE id = :id',{replacements:{id:order.id}});assert.equal(rows[0][0].titulo,'Computador não liga');
});
test('empresa e colaborador não leem ordens fora de seu escopo',async()=>{
 assert.equal((await auth('get','/api/ordens/'+order.id,'foreignUser')).status,404);assert.equal((await auth('get','/api/ordens/'+order.id,'colleague')).status,404);
 assert.equal((await auth('get','/api/ordens','colleague')).body.total,0);assert.equal((await auth('get','/api/dashboard','foreignUser')).body.total,0);
});
test('bloqueia referências de outra empresa e campos extras',async()=>{
 for(const extra of [{setorResponsavelId:foreignSector.id},{categoriaId:foreignCategory.id},{empresaId:otherCompany.id}]){const res=await auth('post','/api/ordens').send({titulo:'Teste de fronteira',descricao:'Uma descrição válida para a ordem.',setorResponsavelId:sector.id,categoriaId:category.id,...extra});assert.equal(res.status,422);}
 assert.equal(await Ordem.count(),1);
});
test('colaborador não altera status nem gerencia usuários',async()=>{
 assert.equal((await auth('patch','/api/ordens/'+order.id,'collaborator').send({status:'Em atendimento',justificativa:'Iniciando atendimento.'})).status,403);
 assert.equal((await auth('get','/api/usuarios','collaborator')).status,403);
});
test('admin de setor não promove conta e não cria usuário em outro setor',async()=>{
 const base={nome:'Novo usuário',email:'new@test.invalid',senha:password,role:'colaborador',setorId:sector.id};
 assert.equal((await auth('post','/api/usuarios','sectorAdmin').send({...base,role:'administrador_principal'})).status,403);
 assert.equal((await auth('post','/api/usuarios','sectorAdmin').send({...base,setorId:otherSector.id})).status,403);
 assert.equal((await auth('patch','/api/usuarios/'+collaborator.id,'sectorAdmin').send({role:'administrador_principal'})).status,403);
});
test('gestor não altera ordem de outro setor',async()=>{
 const res=await auth('post','/api/ordens','colleague').send({titulo:'Demanda para o RH',descricao:'Atualização de informação cadastral.',setorResponsavelId:otherSector.id,categoriaId:category.id});assert.equal(res.status,201);otherOrder=res.body;
 assert.equal((await auth('patch','/api/ordens/'+otherOrder.id,'manager').send({status:'Em atendimento',justificativa:'Tentativa indevida'})).status,404);
});
test('status exige justificativa e sequência; gestão registra histórico',async()=>{
 assert.equal((await auth('patch','/api/ordens/'+order.id,'manager').send({status:'Em atendimento'})).status,422);
 assert.equal((await auth('patch','/api/ordens/'+order.id,'manager').send({status:'Concluída',justificativa:'Fechamento direto'})).status,422);
 let res=await auth('patch','/api/ordens/'+order.id,'manager').send({status:'Em atendimento',responsavelId:manager.id,justificativa:'Atendimento iniciado.'});assert.equal(res.status,200,JSON.stringify(res.body));
 res=await auth('patch','/api/ordens/'+order.id,'manager').send({status:'Concluída',justificativa:'Equipamento reparado.'});assert.equal(res.status,200);assert.ok(res.body.dataConclusao);
 res=await auth('get','/api/ordens/'+order.id,'collaborator');assert.equal(res.body.historico.length,3);
});
test('comentários preservam conteúdo como texto e acesso é restrito',async()=>{
 const res=await auth('post','/api/ordens/'+order.id+'/comentarios','collaborator').send({descricao:'<script>alert(1)</script>'});assert.equal(res.status,201);assert.equal(res.body.descricao,'<script>alert(1)</script>');
 assert.equal((await auth('post','/api/ordens/'+order.id+'/comentarios','colleague').send({descricao:'Sem acesso'})).status,404);
});
test('usuários sem hash; criação válida e e-mail duplicado rejeitado',async()=>{
 const data={nome:'Novo gestor',email:'newmanager@test.invalid',senha:password,role:'gestor',setorId:sector.id};
 const res=await auth('post','/api/usuarios','sectorAdmin').send(data);assert.equal(res.status,201,JSON.stringify(res.body));assert.equal(res.body.senhaHash,undefined);
 assert.equal((await auth('post','/api/usuarios','sectorAdmin').send(data)).status,409);
 const list=await auth('get','/api/usuarios');assert.ok(list.body.items.every(u=>!u.senhaHash&&!u.senha));
});
test('desativação revoga sessão já emitida',async()=>{
 const res=await auth('patch','/api/usuarios/'+colleague.id).send({ativo:false});assert.equal(res.status,200);
 assert.equal((await auth('get','/api/auth/me','colleague')).status,401);
});
test('bloqueia auto-desativação e mudança de perfil no próprio perfil',async()=>{
 assert.equal((await auth('patch','/api/usuarios/'+admin.id).send({ativo:false})).status,422);
 assert.equal((await auth('patch','/api/auth/perfil','collaborator').send({role:'administrador_principal'})).status,422);
});
test('protege contra CSRF por origem e nega JSON malformado',async()=>{
 assert.equal((await request(app).post('/api/auth/logout').set('Cookie',cookies.admin).set('Origin','https://malicioso.invalid')).status,403);
 assert.equal((await request(app).post('/api/auth/logout').set('Cookie',cookies.admin)).status,403);
 assert.equal((await request(app).post('/api/auth/login').set('Content-Type','application/json').send('{invalido')).status,400);
});
test('notificações pertencem ao usuário e auditoria é só do admin principal',async()=>{
 const res=await auth('get','/api/notificacoes','collaborator');assert.ok(res.body.total>0);const id=res.body.items[0].id;
 assert.equal((await auth('patch','/api/notificacoes/'+id+'/lida','manager')).status,404);
 assert.equal((await auth('patch','/api/notificacoes/'+id+'/lida','collaborator')).status,204);
 assert.equal((await auth('get','/api/auditoria','sectorAdmin')).status,403);
 assert.ok((await auth('get','/api/auditoria')).body.total>0);
});
test('transação faz rollback e FK impede referência entre empresas',async()=>{
 const before=await Categoria.count();
 await assert.rejects(write(async transaction=>{await Categoria.create({empresaId:company.id,nome:'Rollback'},{transaction});throw new Error('falha simulada');}));assert.equal(await Categoria.count(),before);
 await assert.rejects(Usuario.create({nome:'Referência errada',email:'bad@test.invalid',senhaHash:'hash',role:'colaborador',empresaId:company.id,setorId:foreignSector.id}));
});
test('paginação é validada e filtros respeitam escopo',async()=>{
 assert.equal((await auth('get','/api/ordens?limit=10000')).status,422);
 const result=await auth('get','/api/ordens?limit=1&page=1');assert.equal(result.body.items.length,1);assert.equal(result.body.total,2);
 assert.equal((await auth('get','/api/ordens?q='+encodeURIComponent("' OR 1=1 --"))).body.total,0);
});
test('troca de senha revoga sessões e exige senha atual',async()=>{
 assert.equal((await auth('patch','/api/auth/perfil','collaborator').send({novaSenha:'Nova-senha-12345',senhaAtual:'errada'})).status,422);
 assert.equal((await auth('patch','/api/auth/perfil','collaborator').send({novaSenha:'Nova-senha-12345',senhaAtual:password})).status,200);
 assert.equal((await auth('get','/api/auth/me','collaborator')).status,401);
});
test('logout invalida a sessão no servidor',async()=>{
 const cookie=await login(admin);assert.equal((await request(app).post('/api/auth/logout').set('Cookie',cookie).set('Origin','http://localhost:5173')).status,204);
 assert.equal((await request(app).get('/api/auth/me').set('Cookie',cookie)).status,401);
});

test('PUT substitui catálogo e DELETE desativa sem apagar histórico',async()=>{
 let res=await auth('post','/api/categorias').send({nome:'Categoria temporária'});assert.equal(res.status,201);const id=res.body.id;
 assert.equal((await auth('put','/api/categorias/'+id).send({nome:'Nome incompleto'})).status,422);
 res=await auth('put','/api/categorias/'+id).send({nome:'Categoria renomeada',ativo:true});assert.equal(res.status,200);assert.equal(res.body.nome,'Categoria renomeada');
 assert.equal((await auth('delete','/api/categorias/'+id)).status,204);assert.equal((await Categoria.findByPk(id)).ativo,false);
 assert.equal((await auth('delete','/api/setores/'+sector.id)).status,409);
});
