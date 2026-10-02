// ==========================================
// UTILITÁRIOS DE AUTENTICAÇÃO
// ==========================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'GESTAO_OS_SECRET';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ==========================================
// GERAR TOKEN JWT
// ==========================================
function gerarToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ==========================================
// VERIFICAR TOKEN JWT
// ==========================================
function verificarToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// ==========================================
// CRIPTOGRAFAR SENHA
// ==========================================
async function criptografarSenha(senha) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(senha, salt);
}

// ==========================================
// COMPARAR SENHA
// ==========================================
async function compararSenha(senha, hash) {
    return await bcrypt.compare(senha, hash);
}

// ==========================================
// GERAR CÓDIGO DE 6 DÍGITOS
// ==========================================
function gerarCodigoVerificacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// GERAR CÓDIGO DA EMPRESA
// Formato: GEST-XXXXXX
// ==========================================
function gerarCodigoEmpresa() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'GEST-';
    for (let i = 0; i < 6; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
}

// ==========================================
// VERIFICAR HIERARQUIA DE PERMISSÕES
// ==========================================
const HIERARQUIA = {
    'colaborador': 1,
    'gestor': 2,
    'administrador_setor': 3,
    'administrador_principal': 4
};

function temPermissao(roleUsuario, roleNecessaria) {
    return HIERARQUIA[roleUsuario] >= HIERARQUIA[roleNecessaria];
}

// ==========================================
// VALIDAR EMAIL
// ==========================================
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ==========================================
// VALIDAR SENHA FORTE
// Mínimo 6 caracteres
// ==========================================
function validarSenha(senha) {
    return senha && senha.length >= 6;
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
module.exports = {
    gerarToken,
    verificarToken,
    criptografarSenha,
    compararSenha,
    gerarCodigoVerificacao,
    gerarCodigoEmpresa,
    temPermissao,
    validarEmail,
    validarSenha,
    HIERARQUIA
};