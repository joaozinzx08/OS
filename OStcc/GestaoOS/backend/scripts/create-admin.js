import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
import { migrate } from '../src/database/migrate.js';
import { db, write } from '../src/database/connection.js';
import { Empresa, Setor, Categoria, Usuario } from '../src/models/index.js';
import { schemas } from '../src/validators/index.js';
// Evita mostrar a senha digitada no terminal interativo.
let muted = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk,encoding); callback(); } });
const rl = createInterface({ input: process.stdin, output, terminal: process.stdin.isTTY });
try {
  const companyName = (await rl.question('Nome da empresa: ')).trim();
  if (companyName.length < 2 || companyName.length > 120) throw new Error('Nome da empresa inválido.');
  const nome = await rl.question('Nome do administrador: ');
  const email = await rl.question('E-mail: ');
  process.stdout.write('Senha (mínimo 10 caracteres): '); muted = true;
  const senha = await rl.question(''); muted = false; process.stdout.write('\n');
  const data = schemas.userCreate.parse({ nome, email, senha, role: 'administrador_principal' });
  await migrate();
  const hash = await bcrypt.hash(data.senha,12);
  await write(async transaction => {
    const company = await Empresa.create({ nome: companyName, email: data.email }, { transaction });
    await Setor.create({ empresaId: company.id, nome: 'Geral', descricao: 'Setor inicial' }, { transaction });
    await Categoria.create({ empresaId: company.id, nome: 'Geral' }, { transaction });
    await Usuario.create({ nome: data.nome, email: data.email, senhaHash: hash, role: data.role, empresaId: company.id }, { transaction });
  });
  console.log('Empresa e administrador criados. Faça login com o e-mail informado.');
} catch (error) { console.error(error.issues?.map(i => i.message).join(' ') || error.message); process.exitCode = 1; }
finally { muted = false; rl.close(); await db.close(); }
