// ==========================================
// SERVIDOR PRINCIPAL - GESTÃO OS
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Importar utilitários
const {
    gerarToken,
    verificarToken,
    criptografarSenha,
    compararSenha,
    gerarCodigoVerificacao,
    gerarCodigoEmpresa,
    temPermissao,
    validarEmail,
    validarSenha
} = require('./utils/auth');

const {
    enviarEmailVerificacao,
    enviarEmailBoasVindas
} = require('./utils/email');

// ==========================================
// CONFIGURAÇÃO DO SERVIDOR
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ==========================================
// MIDDLEWARES DE SEGURANÇA
// ==========================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos.' }
});
app.use('/api/login', authLimiter);
app.use('/api/auth/', authLimiter);

// Arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialDB = {
                empresas: [],
                usuarios: [],
                verificacoes: [],
                setores: [],
                categorias: [],
                ordensServico: [],
                historico: [],
                notificacoes: [],
                auditoria: [],
                chats: [],
                conhecimento: [],
                tokens: []
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
            return initialDB;
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler banco:', error);
        return {
            empresas: [], usuarios: [], verificacoes: [], setores: [],
            categorias: [], ordensServico: [], historico: [], notificacoes: [],
            auditoria: [], chats: [], conhecimento: [], tokens: []
        };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao escrever no banco:', error);
    }
}

// ==========================================
// CONFIGURAÇÃO DE UPLOAD (MULTER)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tipo = req.baseUrl.includes('perfil') ? 'avatars' : 'anexos';
        const uploadDir = path.join(__dirname, 'uploads', tipo);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE) || 5) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
            'application/pdf'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = verificarToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.userId = decoded.userId;
    req.empresaId = decoded.empresaId;
    req.userRole = decoded.role;
    next();
}

// ==========================================
// MIDDLEWARE DE PERMISSÃO
// ==========================================
function requirePermission(roleNecessaria) {
    return (req, res, next) => {
        const db = readDB();
        const user = db.usuarios.find(u => u.id === req.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        if (!temPermissao(user.role, roleNecessaria)) {
            return res.status(403).json({ error: 'Permissão negada' });
        }

        next();
    };
}

// ==========================================
// MIDDLEWARE DE AUDITORIA
// ==========================================
function registrarAuditoria(empresaId, usuarioId, acao, detalhes) {
    const db = readDB();
    db.auditoria.push({
        id: uuidv4(),
        empresaId,
        usuarioId,
        acao,
        detalhes,
        data: new Date().toISOString()
    });
    writeDB(db);
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO E VERIFICAÇÃO
// ==========================================

// ------------------------------------------
// 1. ENVIAR CÓDIGO DE VERIFICAÇÃO
// ------------------------------------------
app.post('/api/auth/enviar-codigo', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        const db = readDB();

        // Verificar se email já está em uso
        const emailEmUso = db.usuarios.some(u => u.email === email) || 
                          db.empresas.some(e => e.email === email);

        if (emailEmUso) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
        }

        // Gerar código
        const codigo = gerarCodigoVerificacao();
        const expiracao = new Date(Date.now() + (parseInt(process.env.CODIGO_EXPIRACAO_MINUTOS) || 5) * 60 * 1000);

        // Remover verificações antigas deste email
        db.verificacoes = db.verificacoes.filter(v => v.email !== email);

        // Adicionar nova verificação
        db.verificacoes.push({
            id: uuidv4(),
            email,
            codigo,
            expiracao: expiracao.toISOString(),
            criadoEm: new Date().toISOString(),
            usado: false
        });

        writeDB(db);

        // Enviar email
        const resultado = await enviarEmailVerificacao(email, codigo);

        res.json({
            message: 'Código enviado com sucesso!',
            // Em desenvolvimento, retorna o código para facilitar testes
            ...(process.env.NODE_ENV === 'development' && { codigo })
        });

    } catch (error) {
        console.error('Erro ao enviar código:', error);
        res.status(500).json({ error: 'Erro ao enviar código' });
    }
});

// ------------------------------------------
// 2. VERIFICAR CÓDIGO
// ------------------------------------------
app.post('/api/auth/verificar-codigo', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ error: 'E-mail e código são obrigatórios' });
        }

        const db = readDB();
        const verificacao = db.verificacoes.find(v => 
            v.email === email && 
            v.codigo === codigo &&
            !v.usado &&
            new Date(v.expiracao) > new Date()
        );

        if (!verificacao) {
            return res.status(400).json({ error: 'Código inválido ou expirado' });
        }

        // Marcar como usado
        verificacao.usado = true;
        verificacao.usadoEm = new Date().toISOString();
        writeDB(db);

        // Gerar token temporário para confirmar que o email foi verificado
        const tokenVerificacao = gerarToken({
            email,
            tipo: 'verificacao_email',
            verificado: true
        });

        res.json({
            message: 'Código verificado com sucesso!',
            verified: true,
            token: tokenVerificacao
        });

    } catch (error) {
        console.error('Erro ao verificar código:', error);
        res.status(500).json({ error: 'Erro ao verificar código' });
    }
});

// ------------------------------------------
// 3. REENVIAR CÓDIGO
// ------------------------------------------
app.post('/api/auth/reenviar-codigo', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        const db = readDB();

        // Gerar novo código
        const codigo = gerarCodigoVerificacao();
        const expiracao = new Date(Date.now() + (parseInt(process.env.CODIGO_EXPIRACAO_MINUTOS) || 5) * 60 * 1000);

        // Remover verificações antigas
        db.verificacoes = db.verificacoes.filter(v => v.email !== email);

        // Adicionar nova
        db.verificacoes.push({
            id: uuidv4(),
            email,
            codigo,
            expiracao: expiracao.toISOString(),
            criadoEm: new Date().toISOString(),
            usado: false
        });

        writeDB(db);

        await enviarEmailVerificacao(email, codigo);

        res.json({
            message: 'Novo código enviado!',
            ...(process.env.NODE_ENV === 'development' && { codigo })
        });

    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        res.status(500).json({ error: 'Erro ao reenviar código' });
    }
});
// ==========================================
// ROTA PÚBLICA - VALIDAR CÓDIGO DA EMPRESA
// ==========================================
app.get('/api/empresas/validar-codigo', (req, res) => {
    try {
        const { codigo } = req.query;

        if (!codigo) {
            return res.status(400).json({ 
                valido: false,
                error: 'Código não informado' 
            });
        }

        const db = readDB();
        const empresa = db.empresas.find(e => 
            e.codigo === codigo.toUpperCase() && e.ativo !== false
        );

        if (!empresa) {
            return res.status(404).json({ 
                valido: false,
                error: 'Empresa não encontrada ou inativa' 
            });
        }

        // Retornar apenas informações públicas (não sensíveis)
        res.json({
            valido: true,
            id: empresa.id,
            nome: empresa.nome,
            codigo: empresa.codigo
        });

    } catch (error) {
        console.error('Erro ao validar código:', error);
        res.status(500).json({ 
            valido: false,
            error: 'Erro ao validar código' 
        });
    }
});

// ==========================================
// ROTAS DE CADASTRO
// ==========================================

// ------------------------------------------
// 4. CRIAR EMPRESA
// ------------------------------------------
app.post('/api/empresas', async (req, res) => {
    try {
        const { nome, responsavel, email, senha } = req.body;

        // Validações
        if (!nome || !responsavel || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        if (!validarSenha(senha)) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const db = readDB();

        // Verificar duplicidade
        if (db.empresas.some(e => e.email === email) || db.usuarios.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
        }

        // Criar empresa
        const empresaId = uuidv4();
        const codigoEmpresa = gerarCodigoEmpresa();

        const novaEmpresa = {
            id: empresaId,
            nome,
            email,
            codigo: codigoEmpresa,
            dataCriacao: new Date().toISOString(),
            ativo: true,
            emailVerificado: true
        };

        // Criar admin
        const senhaHash = await criptografarSenha(senha);
        const adminId = uuidv4();

        const admin = {
            id: adminId,
            nome: responsavel,
            email,
            senha: senhaHash,
            empresaId,
            role: 'administrador_principal',
            setorId: null,
            ativo: true,
            emailVerificado: true,
            dataCriacao: new Date().toISOString(),
            preferencias: {
                tema: 'light',
                notificacoes: { novasOS: true, atualizacoes: true, prazos: true, chat: true }
            }
        };

        // Criar setores padrão
        const setoresPadrao = [
            { nome: 'RH', desc: 'Recursos Humanos' },
            { nome: 'Administração', desc: 'Administração Geral' },
            { nome: 'Documentação Técnica', desc: 'Documentação Técnica' },
            { nome: 'Produção', desc: 'Produção' },
            { nome: 'Controle de Qualidade', desc: 'Controle de Qualidade' },
            { nome: 'TI / Sistemas', desc: 'Tecnologia da Informação' },
            { nome: 'Manutenção', desc: 'Manutenção' },
            { nome: 'Financeiro', desc: 'Financeiro' },
            { nome: 'Compras', desc: 'Compras' },
            { nome: 'Logística', desc: 'Logística' }
        ];

        const setores = setoresPadrao.map(s => ({
            id: uuidv4(),
            empresaId,
            nome: s.nome,
            descricao: s.desc,
            ativo: true,
            dataCriacao: new Date().toISOString()
        }));

        // Criar categorias padrão
        const categorias = [
            {
                id: uuidv4(),
                empresaId,
                nome: 'Estrutura Física',
                subcategorias: ['Equipamentos', 'Instalações', 'Infraestrutura', 'Segurança Patrimonial']
            },
            {
                id: uuidv4(),
                empresaId,
                nome: 'Sistemas e Processos Internos',
                subcategorias: ['Processos', 'Sistemas', 'Documentação', 'Metodologias']
            },
            {
                id: uuidv4(),
                empresaId,
                nome: 'Pessoas, Conduta e Situações Sensíveis',
                subcategorias: ['Recursos Humanos', 'Conduta', 'Denúncias', 'Sugestões']
            }
        ];

        // Criar chat geral
        const chatGeral = {
            id: uuidv4(),
            empresaId,
            nome: 'Geral',
            tipo: 'empresa',
            participantes: [adminId],
            mensagens: [],
            dataCriacao: new Date().toISOString()
        };

        // Salvar no banco
        db.empresas.push(novaEmpresa);
        db.usuarios.push(admin);
        db.setores.push(...setores);
        db.categorias.push(...categorias);
        db.chats.push(chatGeral);
        writeDB(db);

        // Registrar auditoria
        registrarAuditoria(empresaId, adminId, 'Empresa criada', `Empresa ${nome} criada`);

        // Gerar token de login
        const token = gerarToken({
            userId: adminId,
            empresaId,
            role: 'administrador_principal'
        });

        res.status(201).json({
            message: 'Empresa criada com sucesso!',
            token,
            empresa: {
                id: empresaId,
                nome,
                codigo: codigoEmpresa
            },
            usuario: {
                id: adminId,
                nome: responsavel,
                email,
                role: 'administrador_principal'
            }
        });

    } catch (error) {
        console.error('Erro ao criar empresa:', error);
        res.status(500).json({ error: 'Erro ao criar empresa' });
    }
});
// ==========================================
// VALIDAR CÓDIGO DA EMPRESA
// ==========================================
app.get('/api/empresas/validar-codigo', (req, res) => {
    const { codigo } = req.query;

    if (!codigo) {
        return res.status(400).json({ error: 'Código não informado' });
    }

    const db = readDB();
    const empresa = db.empresas.find(e => 
        e.codigo === codigo.toUpperCase() && e.ativo
    );

    if (!empresa) {
        return res.status(404).json({ 
            error: 'Empresa não encontrada ou inativa',
            valido: false 
        });
    }

    // Retornar apenas informações públicas (não sensíveis)
    res.json({
        valido: true,
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo
    });
});
// ------------------------------------------
// 5. ENTRAR EM EMPRESA (Funcionário)
// ------------------------------------------
// ==========================================
// ENTRAR EM EMPRESA (SEM VERIFICAÇÃO DE EMAIL)
// ==========================================
app.post('/api/empresas/entrar', async (req, res) => {
    try {
        const { codigo, nome, email, senha } = req.body;

        // Validações
        if (!codigo || !nome || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        if (!validarSenha(senha)) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const db = readDB();

        // Verificar empresa
        const empresa = db.empresas.find(e => e.codigo === codigo.toUpperCase() && e.ativo);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada ou inativa' });
        }

        // Verificar duplicidade
        if (db.usuarios.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
        }

        // Criar usuário
        const senhaHash = await criptografarSenha(senha);
        const userId = uuidv4();

        const setorPadrao = db.setores.find(s => s.empresaId === empresa.id && s.nome === 'RH');

        const usuario = {
            id: userId,
            nome,
            email,
            senha: senhaHash,
            empresaId: empresa.id,
            role: 'colaborador',
            setorId: setorPadrao?.id || null,
            ativo: true,
            emailVerificado: true,
            dataCriacao: new Date().toISOString()
        };

        db.usuarios.push(usuario);

        // Adicionar ao chat geral
        if (db.chats) {
            const chatGeral = db.chats.find(c => c.empresaId === empresa.id && c.tipo === 'empresa');
            if (chatGeral && !chatGeral.participantes.includes(userId)) {
                chatGeral.participantes.push(userId);
            }
        }

        writeDB(db);

        // Registrar auditoria
        registrarAuditoria(empresa.id, userId, 'Novo usuário', `${nome} entrou na empresa`);

        // Notificar admins
        const admins = db.usuarios.filter(u => 
            u.empresaId === empresa.id && 
            (u.role === 'administrador_principal' || u.role === 'administrador_setor')
        );

        admins.forEach(admin => {
            db.notificacoes.push({
                id: uuidv4(),
                empresaId: empresa.id,
                usuarioId: admin.id,
                titulo: 'Novo colaborador',
                mensagem: `${nome} entrou na empresa`,
                lida: false,
                data: new Date().toISOString()
            });
        });
        writeDB(db);

        // Gerar token
        const token = gerarToken({
            userId,
            empresaId: empresa.id,
            role: 'colaborador'
        });

        res.status(201).json({
            message: 'Entrada realizada com sucesso!',
            token,
            empresa: {
                id: empresa.id,
                nome: empresa.nome,
                codigo: empresa.codigo
            },
            usuario: {
                id: userId,
                nome,
                email,
                role: 'colaborador',
                setorId: usuario.setorId
            }
        });

    } catch (error) {
        console.error('Erro ao entrar em empresa:', error);
        res.status(500).json({ error: 'Erro ao entrar em empresa' });
    }
});

// ------------------------------------------
// 6. LOGIN
// ------------------------------------------
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        }

        const db = readDB();
        const user = db.usuarios.find(u => u.email === email && u.ativo);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const senhaValida = await compararSenha(senha, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const empresa = db.empresas.find(e => e.id === user.empresaId);
        if (!empresa || !empresa.ativo) {
            return res.status(403).json({ error: 'Empresa inativa' });
        }

        // Registrar auditoria
        registrarAuditoria(user.empresaId, user.id, 'Login', `${user.nome} fez login`);

        const token = gerarToken({
            userId: user.id,
            empresaId: user.empresaId,
            role: user.role
        });

        res.json({
            token,
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                setorId: user.setorId,
                empresaId: user.empresaId,
                avatar: user.avatar || null
            },
            empresa: {
                id: empresa.id,
                nome: empresa.nome,
                codigo: empresa.codigo
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// ==========================================
// ROTAS PROTEGIDAS - EMPRESA
// ==========================================

// ------------------------------------------
// 7. OBTER DADOS DA EMPRESA
// ------------------------------------------
app.get('/api/empresa', authenticate, (req, res) => {
    const db = readDB();
    const empresa = db.empresas.find(e => e.id === req.empresaId);

    if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const usuarios = db.usuarios.filter(u => u.empresaId === req.empresaId);
    const setores = db.setores.filter(s => s.empresaId === req.empresaId);
    const ordens = db.ordensServico.filter(o => o.empresaId === req.empresaId);

    res.json({
        ...empresa,
        stats: {
            totalUsuarios: usuarios.length,
            totalSetores: setores.length,
            totalOrdens: ordens.length,
            ordensAbertas: ordens.filter(o => o.status === 'Aberta').length,
            ordensConcluidas: ordens.filter(o => o.status === 'Concluída').length
        }
    });
});

// ------------------------------------------
// 8. RENOVAR CÓDIGO DA EMPRESA
// ------------------------------------------
app.post('/api/empresa/renovar-codigo', authenticate, requirePermission('administrador_principal'), (req, res) => {
    const db = readDB();
    const empresaIndex = db.empresas.findIndex(e => e.id === req.empresaId);

    if (empresaIndex === -1) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const novoCodigo = gerarCodigoEmpresa();
    db.empresas[empresaIndex].codigo = novoCodigo;
    writeDB(db);

    registrarAuditoria(req.empresaId, req.userId, 'Renovou código', `Novo código: ${novoCodigo}`);

    res.json({
        message: 'Código renovado com sucesso!',
        codigo: novoCodigo
    });
});

// ==========================================
// ROTAS PROTEGIDAS - USUÁRIOS
// ==========================================

// Listar usuários
app.get('/api/usuarios', authenticate, (req, res) => {
    const db = readDB();
    const usuarios = db.usuarios
        .filter(u => u.empresaId === req.empresaId)
        .map(u => ({ ...u, senha: undefined }));
    res.json(usuarios);
});

// Criar usuário
app.post('/api/usuarios', authenticate, requirePermission('administrador_setor'), async (req, res) => {
    try {
        const { nome, email, senha, role, setorId } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: 'E-mail inválido' });
        }

        if (!validarSenha(senha)) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const db = readDB();

        if (db.usuarios.some(u => u.email === email)) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        const senhaHash = await criptografarSenha(senha);
        const userId = uuidv4();

        const usuario = {
            id: userId,
            nome,
            email,
            senha: senhaHash,
            empresaId: req.empresaId,
            role: role || 'colaborador',
            setorId: setorId || null,
            ativo: true,
            emailVerificado: true,
            dataCriacao: new Date().toISOString()
        };

        db.usuarios.push(usuario);
        writeDB(db);

        registrarAuditoria(req.empresaId, req.userId, 'Criou usuário', `${nome} (${role})`);

        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            usuario: { ...usuario, senha: undefined }
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Atualizar usuário
app.put('/api/usuarios/:id', authenticate, requirePermission('administrador_setor'), async (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { nome, role, setorId, ativo, senha } = req.body;

    const userIndex = db.usuarios.findIndex(u => u.id === id && u.empresaId === req.empresaId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (nome) db.usuarios[userIndex].nome = nome;
    if (role) db.usuarios[userIndex].role = role;
    if (setorId !== undefined) db.usuarios[userIndex].setorId = setorId;
    if (ativo !== undefined) db.usuarios[userIndex].ativo = ativo;
    
    if (senha && validarSenha(senha)) {
        db.usuarios[userIndex].senha = await criptografarSenha(senha);
    }

    writeDB(db);

    registrarAuditoria(req.empresaId, req.userId, 'Atualizou usuário', db.usuarios[userIndex].nome);

    res.json({
        message: 'Usuário atualizado!',
        usuario: { ...db.usuarios[userIndex], senha: undefined }
    });
});

// ==========================================
// ROTAS PROTEGIDAS - SETORES
// ==========================================

app.get('/api/setores', authenticate, (req, res) => {
    const db = readDB();
    const setores = db.setores.filter(s => s.empresaId === req.empresaId);
    res.json(setores);
});

app.post('/api/setores', authenticate, requirePermission('administrador_principal'), (req, res) => {
    const { nome, descricao } = req.body;

    if (!nome) {
        return res.status(400).json({ error: 'Nome do setor é obrigatório' });
    }

    const db = readDB();

    const setor = {
        id: uuidv4(),
        empresaId: req.empresaId,
        nome,
        descricao: descricao || '',
        ativo: true,
        dataCriacao: new Date().toISOString()
    };

    db.setores.push(setor);
    writeDB(db);

    registrarAuditoria(req.empresaId, req.userId, 'Criou setor', nome);

    res.status(201).json(setor);
});

app.put('/api/setores/:id', authenticate, requirePermission('administrador_principal'), (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    const index = db.setores.findIndex(s => s.id === id && s.empresaId === req.empresaId);
    if (index === -1) {
        return res.status(404).json({ error: 'Setor não encontrado' });
    }

    if (nome) db.setores[index].nome = nome;
    if (descricao !== undefined) db.setores[index].descricao = descricao;
    if (ativo !== undefined) db.setores[index].ativo = ativo;

    writeDB(db);
    registrarAuditoria(req.empresaId, req.userId, 'Atualizou setor', db.setores[index].nome);

    res.json(db.setores[index]);
});

app.delete('/api/setores/:id', authenticate, requirePermission('administrador_principal'), (req, res) => {
    const db = readDB();
    const { id } = req.params;

    const index = db.setores.findIndex(s => s.id === id && s.empresaId === req.empresaId);
    if (index === -1) {
        return res.status(404).json({ error: 'Setor não encontrado' });
    }

    const nome = db.setores[index].nome;
    db.setores.splice(index, 1);
    writeDB(db);

    registrarAuditoria(req.empresaId, req.userId, 'Removeu setor', nome);

    res.json({ message: 'Setor removido' });
});

// ==========================================
// ROTAS PROTEGIDAS - ORDENS DE SERVIÇO
// ==========================================

app.get('/api/ordens', authenticate, (req, res) => {
    const db = readDB();
    const { status, setorId, categoria, prioridade } = req.query;

    let ordens = db.ordensServico.filter(o => o.empresaId === req.empresaId);

    if (status) ordens = ordens.filter(o => o.status === status);
    if (setorId) ordens = ordens.filter(o => o.setorResponsavelId === setorId);
    if (categoria) ordens = ordens.filter(o => o.categoria === categoria);
    if (prioridade) ordens = ordens.filter(o => o.prioridade === prioridade);

    // Filtros por role
    const user = db.usuarios.find(u => u.id === req.userId);
    if (user?.role === 'colaborador') {
        ordens = ordens.filter(o => o.solicitanteId === req.userId || !o.sigilo);
    } else if (user?.role === 'gestor' && user.setorId) {
        ordens = ordens.filter(o => o.setorResponsavelId === user.setorId);
    } else if (user?.role === 'administrador_setor' && user.setorId) {
        ordens = ordens.filter(o => o.setorResponsavelId === user.setorId);
    }

    res.json(ordens);
});

app.post('/api/ordens', authenticate, upload.array('anexos', 5), (req, res) => {
    const db = readDB();
    const {
        titulo, descricao, setorResponsavelId, categoria, subcategoria,
        prioridade, prazo, sigilo
    } = req.body;

    if (!titulo || !descricao || !setorResponsavelId) {
        return res.status(400).json({ error: 'Título, descrição e setor são obrigatórios' });
    }

    const setor = db.setores.find(s => s.id === setorResponsavelId && s.empresaId === req.empresaId);
    if (!setor) {
        return res.status(400).json({ error: 'Setor não encontrado' });
    }

    const os = {
        id: uuidv4(),
        empresaId: req.empresaId,
        solicitanteId: req.userId,
        setorSolicitanteId: req.body.setorSolicitanteId || null,
        setorResponsavelId,
        titulo,
        descricao,
        categoria: categoria || 'Não categorizada',
        subcategoria: subcategoria || '',
        prioridade: prioridade || 'Média',
        status: 'Aberta',
        prazo: prazo || null,
        sigilo: sigilo === 'true' || sigilo === true,
        anexos: req.files ? req.files.map(f => f.filename) : [],
        dataAbertura: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        dataConclusao: null
    };

    db.ordensServico.push(os);

    // Histórico
    db.historico.push({
        id: uuidv4(),
        ordemId: os.id,
        empresaId: req.empresaId,
        usuarioId: req.userId,
        acao: 'Abertura',
        descricao: 'Ordem de serviço criada',
        data: new Date().toISOString()
    });

    // Notificar gestores do setor
    const gestores = db.usuarios.filter(u => 
        u.empresaId === req.empresaId && 
        (u.role === 'gestor' || u.role === 'administrador_setor') &&
        u.setorId === setorResponsavelId
    );

    gestores.forEach(g => {
        db.notificacoes.push({
            id: uuidv4(),
            empresaId: req.empresaId,
            usuarioId: g.id,
            titulo: 'Nova OS',
            mensagem: `${titulo}`,
            lida: false,
            data: new Date().toISOString()
        });
    });

    writeDB(db);
    registrarAuditoria(req.empresaId, req.userId, 'Criou OS', `${titulo}`);

    res.status(201).json(os);
});

app.put('/api/ordens/:id', authenticate, (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { status, descricao, prioridade, prazo, observacao } = req.body;

    const index = db.ordensServico.findIndex(o => o.id === id && o.empresaId === req.empresaId);
    if (index === -1) {
        return res.status(404).json({ error: 'OS não encontrada' });
    }

    const os = db.ordensServico[index];
    const user = db.usuarios.find(u => u.id === req.userId);

    // Colaborador só edita suas próprias OS
    if (user.role === 'colaborador' && os.solicitanteId !== req.userId) {
        return res.status(403).json({ error: 'Sem permissão' });
    }

    const statusAnterior = os.status;

    if (status) os.status = status;
    if (descricao) os.descricao = descricao;
    if (prioridade) os.prioridade = prioridade;
    if (prazo) os.prazo = prazo;

    if (observacao) {
        db.historico.push({
            id: uuidv4(),
            ordemId: os.id,
            empresaId: req.empresaId,
            usuarioId: req.userId,
            acao: 'Observação',
            descricao: observacao,
            data: new Date().toISOString()
        });
    }

    if (status === 'Concluída') {
        os.dataConclusao = new Date().toISOString();
    }

    os.dataAtualizacao = new Date().toISOString();

    if (status && status !== statusAnterior) {
        db.historico.push({
            id: uuidv4(),
            ordemId: os.id,
            empresaId: req.empresaId,
            usuarioId: req.userId,
            acao: 'Status alterado',
            descricao: `${statusAnterior} → ${status}`,
            data: new Date().toISOString()
        });

        db.notificacoes.push({
            id: uuidv4(),
            empresaId: req.empresaId,
            usuarioId: os.solicitanteId,
            titulo: 'Status atualizado',
            mensagem: `OS #${os.id.substring(0, 8)}: ${status}`,
            lida: false,
            data: new Date().toISOString()
        });
    }

    writeDB(db);
    registrarAuditoria(req.empresaId, req.userId, 'Atualizou OS', os.titulo);

    res.json(os);
});

// ==========================================
// ROTAS PROTEGIDAS - DASHBOARD
// ==========================================

app.get('/api/dashboard', authenticate, (req, res) => {
    const db = readDB();
    const user = db.usuarios.find(u => u.id === req.userId);

    let ordens = db.ordensServico.filter(o => o.empresaId === req.empresaId);

    if (user.role === 'colaborador') {
        ordens = ordens.filter(o => o.solicitanteId === req.userId);
    } else if (user.role === 'gestor' && user.setorId) {
        ordens = ordens.filter(o => o.setorResponsavelId === user.setorId);
    } else if (user.role === 'administrador_setor' && user.setorId) {
        ordens = ordens.filter(o => o.setorResponsavelId === user.setorId);
    }

    const stats = {
        total: ordens.length,
        abertas: ordens.filter(o => o.status === 'Aberta').length,
        emAtendimento: ordens.filter(o => o.status === 'Em atendimento').length,
        concluidas: ordens.filter(o => o.status === 'Concluída').length,
        urgentes: ordens.filter(o => o.prioridade === 'Urgente' && o.status !== 'Concluída').length,
        atrasadas: ordens.filter(o => o.prazo && new Date(o.prazo) < new Date() && o.status !== 'Concluída').length
    };

    const porSetor = {};
    const porStatus = {};
    const porCategoria = {};

    ordens.forEach(o => {
        const setor = db.setores.find(s => s.id === o.setorResponsavelId);
        const setorNome = setor ? setor.nome : 'Não definido';
        porSetor[setorNome] = (porSetor[setorNome] || 0) + 1;
        porStatus[o.status] = (porStatus[o.status] || 0) + 1;
        porCategoria[o.categoria] = (porCategoria[o.categoria] || 0) + 1;
    });

    res.json({
        stats,
        charts: {
            porSetor: Object.entries(porSetor).map(([label, value]) => ({ label, value })),
            porStatus: Object.entries(porStatus).map(([label, value]) => ({ label, value })),
            porCategoria: Object.entries(porCategoria).map(([label, value]) => ({ label, value }))
        },
        ultimasOS: ordens.slice(-5).reverse()
    });
});

// ==========================================
// ROTAS PROTEGIDAS - NOTIFICAÇÕES
// ==========================================

app.get('/api/notificacoes', authenticate, (req, res) => {
    const db = readDB();
    const notificacoes = db.notificacoes
        .filter(n => n.empresaId === req.empresaId && n.usuarioId === req.userId)
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json({
        notificacoes: notificacoes.slice(0, 20),
        naoLidas: notificacoes.filter(n => !n.lida).length
    });
});

app.put('/api/notificacoes/:id', authenticate, (req, res) => {
    const db = readDB();
    const index = db.notificacoes.findIndex(n => n.id === req.params.id && n.usuarioId === req.userId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    db.notificacoes[index].lida = true;
    writeDB(db);
    res.json({ message: 'Marcada como lida' });
});

// ==========================================
// ROTAS PROTEGIDAS - AUDITORIA
// ==========================================

app.get('/api/auditoria', authenticate, requirePermission('administrador_setor'), (req, res) => {
    const db = readDB();
    const auditoria = db.auditoria
        .filter(a => a.empresaId === req.empresaId)
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 100);
    
    res.json(auditoria);
});

// ==========================================
// ROTAS PROTEGIDAS - RELATÓRIOS
// ==========================================

app.get('/api/relatorios', authenticate, requirePermission('administrador_setor'), (req, res) => {
    const db = readDB();
    const { periodo, setorId } = req.query;

    let ordens = db.ordensServico.filter(o => o.empresaId === req.empresaId);

    if (setorId) ordens = ordens.filter(o => o.setorResponsavelId === setorId);

    if (periodo) {
        const agora = new Date();
        const limite = new Date();
        if (periodo === '7d') limite.setDate(agora.getDate() - 7);
        else if (periodo === '30d') limite.setDate(agora.getDate() - 30);
        else if (periodo === '90d') limite.setDate(agora.getDate() - 90);
        else if (periodo === '365d') limite.setDate(agora.getDate() - 365);
        
        ordens = ordens.filter(o => new Date(o.dataAbertura) >= limite);
    }

    const total = ordens.length;
    const concluidas = ordens.filter(o => o.status === 'Concluída').length;
    
    const tempoMedio = concluidas > 0 ? 
        ordens
            .filter(o => o.status === 'Concluída' && o.dataConclusao)
            .reduce((acc, o) => {
                const diff = (new Date(o.dataConclusao) - new Date(o.dataAbertura)) / (1000 * 60 * 60 * 24);
                return acc + diff;
            }, 0) / concluidas : 0;

    res.json({
        total,
        concluidas,
        emAndamento: ordens.filter(o => o.status !== 'Concluída' && o.status !== 'Cancelada').length,
        taxaConclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0,
        tempoMedio: Math.round(tempoMedio * 10) / 10,
        porPrioridade: {
            Baixa: ordens.filter(o => o.prioridade === 'Baixa').length,
            Média: ordens.filter(o => o.prioridade === 'Média').length,
            Alta: ordens.filter(o => o.prioridade === 'Alta').length,
            Urgente: ordens.filter(o => o.prioridade === 'Urgente').length
        }
    });
});
// ==========================================
// ROTAS DE CONHECIMENTO (BASE DE CONHECIMENTO)
// ==========================================

// ------------------------------------------
// LISTAR ARTIGOS
// ------------------------------------------
app.get('/api/conhecimento', authenticate, (req, res) => {
    try {
        const db = readDB();
        
        // Inicializar se não existir
        if (!db.conhecimento) {
            db.conhecimento = [];
        }

        const artigos = db.conhecimento
            .filter(a => a.empresaId === req.empresaId)
            .sort((a, b) => {
                // Fixados primeiro
                if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
                // Depois por data (mais recente)
                return new Date(b.criadoEm) - new Date(a.criadoEm);
            });

        res.json(artigos);

    } catch (error) {
        console.error('Erro ao listar conhecimento:', error);
        res.status(500).json({ error: 'Erro ao listar artigos' });
    }
});

// ------------------------------------------
// CRIAR ARTIGO
// ------------------------------------------
app.post('/api/conhecimento', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const {
            titulo,
            categoria,
            tags,
            resumo,
            conteudo,
            fixado
        } = req.body;

        // Validações
        if (!titulo || titulo.length < 5) {
            return res.status(400).json({ error: 'Título deve ter no mínimo 5 caracteres' });
        }

        if (!resumo || resumo.length < 10) {
            return res.status(400).json({ error: 'Resumo deve ter no mínimo 10 caracteres' });
        }

        if (!conteudo || conteudo.length < 20) {
            return res.status(400).json({ error: 'Conteúdo deve ter no mínimo 20 caracteres' });
        }

        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const novoArtigo = {
            id: uuidv4(),
            empresaId: req.empresaId,
            titulo,
            categoria: categoria || 'Outros',
            tags: Array.isArray(tags) ? tags : [],
            resumo,
            conteudo,
            fixado: fixado === true,
            autorId: req.userId,
            visualizacoes: 0,
            uteis: 0,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        db.conhecimento.push(novoArtigo);
        writeDB(db);

        // Registrar auditoria
        registrarAuditoria(
            req.empresaId,
            req.userId,
            'Criou artigo',
            `${titulo} (${categoria})`
        );

        res.status(201).json(novoArtigo);

    } catch (error) {
        console.error('Erro ao criar artigo:', error);
        res.status(500).json({ error: 'Erro ao criar artigo' });
    }
});

// ------------------------------------------
// ATUALIZAR ARTIGO
// ------------------------------------------
app.put('/api/conhecimento/:id', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            categoria,
            tags,
            resumo,
            conteudo,
            fixado,
            visualizacoes,
            uteis
        } = req.body;

        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const index = db.conhecimento.findIndex(a => 
            a.id === id && a.empresaId === req.empresaId
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Artigo não encontrado' });
        }

        // Atualizar campos fornecidos
        if (titulo !== undefined) db.conhecimento[index].titulo = titulo;
        if (categoria !== undefined) db.conhecimento[index].categoria = categoria;
        if (tags !== undefined) db.conhecimento[index].tags = Array.isArray(tags) ? tags : [];
        if (resumo !== undefined) db.conhecimento[index].resumo = resumo;
        if (conteudo !== undefined) db.conhecimento[index].conteudo = conteudo;
        if (fixado !== undefined) db.conhecimento[index].fixado = fixado === true;
        
        // Incrementar visualizações ou úteis (uso público)
        if (visualizacoes !== undefined) {
            db.conhecimento[index].visualizacoes = (db.conhecimento[index].visualizacoes || 0) + 1;
        }
        if (uteis !== undefined) {
            db.conhecimento[index].uteis = (db.conhecimento[index].uteis || 0) + 1;
        }

        db.conhecimento[index].atualizadoEm = new Date().toISOString();

        writeDB(db);

        // Registrar auditoria (só se foi edição real)
        if (titulo !== undefined || conteudo !== undefined) {
            registrarAuditoria(
                req.empresaId,
                req.userId,
                'Atualizou artigo',
                db.conhecimento[index].titulo
            );
        }

        res.json(db.conhecimento[index]);

    } catch (error) {
        console.error('Erro ao atualizar artigo:', error);
        res.status(500).json({ error: 'Erro ao atualizar artigo' });
    }
});

// ------------------------------------------
// EXCLUIR ARTIGO
// ------------------------------------------
app.delete('/api/conhecimento/:id', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const { id } = req.params;
        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const index = db.conhecimento.findIndex(a => 
            a.id === id && a.empresaId === req.empresaId
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Artigo não encontrado' });
        }

        const titulo = db.conhecimento[index].titulo;
        db.conhecimento.splice(index, 1);
        writeDB(db);

        // Registrar auditoria
        registrarAuditoria(
            req.empresaId,
            req.userId,
            'Removeu artigo',
            titulo
        );

        res.json({ message: 'Artigo excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir artigo:', error);
        res.status(500).json({ error: 'Erro ao excluir artigo' });
    }
});
// ==========================================
// ROTAS DE CONHECIMENTO (BASE DE CONHECIMENTO)
// ==========================================

// ------------------------------------------
// LISTAR ARTIGOS
// ------------------------------------------
app.get('/api/conhecimento', authenticate, (req, res) => {
    try {
        const db = readDB();
        
        if (!db.conhecimento) {
            db.conhecimento = [];
        }

        const artigos = db.conhecimento
            .filter(a => a.empresaId === req.empresaId)
            .sort((a, b) => {
                if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
                return new Date(b.criadoEm) - new Date(a.criadoEm);
            });

        res.json(artigos);

    } catch (error) {
        console.error('Erro ao listar conhecimento:', error);
        res.status(500).json({ error: 'Erro ao listar artigos' });
    }
});

// ------------------------------------------
// CRIAR ARTIGO
// ------------------------------------------
app.post('/api/conhecimento', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const { titulo, categoria, tags, resumo, conteudo, fixado } = req.body;

        if (!titulo || titulo.length < 5) {
            return res.status(400).json({ error: 'Título deve ter no mínimo 5 caracteres' });
        }

        if (!resumo || resumo.length < 10) {
            return res.status(400).json({ error: 'Resumo deve ter no mínimo 10 caracteres' });
        }

        if (!conteudo || conteudo.length < 20) {
            return res.status(400).json({ error: 'Conteúdo deve ter no mínimo 20 caracteres' });
        }

        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const novoArtigo = {
            id: uuidv4(),
            empresaId: req.empresaId,
            titulo,
            categoria: categoria || 'Outros',
            tags: Array.isArray(tags) ? tags : [],
            resumo,
            conteudo,
            fixado: fixado === true,
            autorId: req.userId,
            visualizacoes: 0,
            uteis: 0,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        db.conhecimento.push(novoArtigo);
        writeDB(db);

        registrarAuditoria(
            req.empresaId,
            req.userId,
            'Criou artigo',
            `${titulo} (${categoria})`
        );

        res.status(201).json(novoArtigo);

    } catch (error) {
        console.error('Erro ao criar artigo:', error);
        res.status(500).json({ error: 'Erro ao criar artigo' });
    }
});

// ------------------------------------------
// ATUALIZAR ARTIGO
// ------------------------------------------
app.put('/api/conhecimento/:id', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, categoria, tags, resumo, conteudo, fixado, visualizacoes, uteis } = req.body;

        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const index = db.conhecimento.findIndex(a => 
            a.id === id && a.empresaId === req.empresaId
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Artigo não encontrado' });
        }

        if (titulo !== undefined) db.conhecimento[index].titulo = titulo;
        if (categoria !== undefined) db.conhecimento[index].categoria = categoria;
        if (tags !== undefined) db.conhecimento[index].tags = Array.isArray(tags) ? tags : [];
        if (resumo !== undefined) db.conhecimento[index].resumo = resumo;
        if (conteudo !== undefined) db.conhecimento[index].conteudo = conteudo;
        if (fixado !== undefined) db.conhecimento[index].fixado = fixado === true;
        
        if (visualizacoes !== undefined) {
            db.conhecimento[index].visualizacoes = (db.conhecimento[index].visualizacoes || 0) + 1;
        }
        if (uteis !== undefined) {
            db.conhecimento[index].uteis = (db.conhecimento[index].uteis || 0) + 1;
        }

        db.conhecimento[index].atualizadoEm = new Date().toISOString();

        writeDB(db);

        if (titulo !== undefined || conteudo !== undefined) {
            registrarAuditoria(
                req.empresaId,
                req.userId,
                'Atualizou artigo',
                db.conhecimento[index].titulo
            );
        }

        res.json(db.conhecimento[index]);

    } catch (error) {
        console.error('Erro ao atualizar artigo:', error);
        res.status(500).json({ error: 'Erro ao atualizar artigo' });
    }
});

// ------------------------------------------
// EXCLUIR ARTIGO
// ------------------------------------------
app.delete('/api/conhecimento/:id', authenticate, requirePermission('gestor'), (req, res) => {
    try {
        const { id } = req.params;
        const db = readDB();

        if (!db.conhecimento) db.conhecimento = [];

        const index = db.conhecimento.findIndex(a => 
            a.id === id && a.empresaId === req.empresaId
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Artigo não encontrado' });
        }

        const titulo = db.conhecimento[index].titulo;
        db.conhecimento.splice(index, 1);
        writeDB(db);

        registrarAuditoria(
            req.empresaId,
            req.userId,
            'Removeu artigo',
            titulo
        );

        res.json({ message: 'Artigo excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir artigo:', error);
        res.status(500).json({ error: 'Erro ao excluir artigo' });
    }
});

// ==========================================
// ROTA DE PERFIL
// ==========================================

app.get('/api/perfil', authenticate, (req, res) => {
    const db = readDB();
    const user = db.usuarios.find(u => u.id === req.userId);
    
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const minhasOS = db.ordensServico.filter(o => o.solicitanteId === req.userId);
    
    res.json({
        ...user,
        senha: undefined,
        stats: {
            totalOS: minhasOS.length,
            concluidas: minhasOS.filter(o => o.status === 'Concluída').length,
            abertas: minhasOS.filter(o => o.status === 'Aberta').length,
            emAtendimento: minhasOS.filter(o => o.status === 'Em atendimento').length
        }
    });
});

app.put('/api/perfil', authenticate, async (req, res) => {
    const db = readDB();
    const index = db.usuarios.findIndex(u => u.id === req.userId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { nome, senhaAtual, novaSenha, preferencias } = req.body;

    if (nome) db.usuarios[index].nome = nome;

    if (senhaAtual && novaSenha) {
        const senhaValida = await compararSenha(senhaAtual, db.usuarios[index].senha);
        if (!senhaValida) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }
        if (!validarSenha(novaSenha)) {
            return res.status(400).json({ error: 'Nova senha muito curta' });
        }
        db.usuarios[index].senha = await criptografarSenha(novaSenha);
    }

    if (preferencias) {
        db.usuarios[index].preferencias = {
            ...db.usuarios[index].preferencias,
            ...preferencias
        };
    }

    writeDB(db);
    res.json({ message: 'Perfil atualizado!', usuario: { ...db.usuarios[index], senha: undefined } });
});

// Upload de avatar
app.post('/api/perfil/avatar', authenticate, upload.single('avatar'), (req, res) => {
    const db = readDB();
    const index = db.usuarios.findIndex(u => u.id === req.userId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    db.usuarios[index].avatar = req.file.filename;
    writeDB(db);

    res.json({ 
        message: 'Avatar atualizado!',
        avatar: req.file.filename
    });
});

// ==========================================
// ROTA DE STATUS
// ==========================================
app.get('/api/status', (req, res) => {
    const db = readDB();
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        stats: {
            empresas: db.empresas.length,
            usuarios: db.usuarios.length,
            ordens: db.ordensServico.length
        }
    });
});

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    
    res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// Rota 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 SERVIDOR GESTÃO OS INICIADO');
    console.log('========================================');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Banco: ${DB_PATH}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================\n');
});