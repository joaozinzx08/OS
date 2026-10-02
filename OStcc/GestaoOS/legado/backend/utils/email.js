// ==========================================
// UTILITÁRIOS DE EMAIL
// ==========================================

const nodemailer = require('nodemailer');

// ==========================================
// CRIAR TRANSPORTER (conexão SMTP)
// ==========================================
function criarTransporter() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true para 465, false para outras portas
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

// ==========================================
// TEMPLATE HTML DO EMAIL DE VERIFICAÇÃO
// ==========================================
function templateVerificacao(codigo, nomeEmpresa = 'Gestão OS') {
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verificação de E-mail</title>
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                            
                            <!-- HEADER -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:40px 30px;text-align:center;">
                                    <div style="font-size:48px;margin-bottom:8px;">📋</div>
                                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Gestão OS</h1>
                                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Sistema de Ordens de Serviço</p>
                                </td>
                            </tr>
                            
                            <!-- CONTEÚDO -->
                            <tr>
                                <td style="padding:40px 30px;">
                                    <h2 style="color:#0f172a;margin:0 0 16px;font-size:20px;">🔐 Verificação de E-mail</h2>
                                    
                                    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                                        Olá! Você solicitou acesso ao sistema <strong>${nomeEmpresa}</strong>.
                                        Use o código abaixo para verificar seu e-mail:
                                    </p>
                                    
                                    <!-- CÓDIGO -->
                                    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                                        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;font-family:'Courier New',monospace;">
                                            ${codigo}
                                        </div>
                                    </div>
                                    
                                    <p style="color:#64748b;font-size:14px;margin:24px 0 0;line-height:1.6;">
                                        ⏱️ Este código é válido por <strong style="color:#0f172a;">5 minutos</strong>.
                                    </p>
                                    
                                    <p style="color:#64748b;font-size:14px;margin:12px 0 0;line-height:1.6;">
                                        Se você não solicitou este código, ignore este e-mail.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- FOOTER -->
                            <tr>
                                <td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
                                    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
                                        Este é um e-mail automático. Por favor, não responda.
                                    </p>
                                    <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">
                                        © 2024 Gestão OS - Todos os direitos reservados
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

// ==========================================
// TEMPLATE DE BOAS-VINDAS
// ==========================================
function templateBoasVindas(nome, nomeEmpresa, codigoEmpresa) {
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Bem-vindo!</title>
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                            
                            <tr>
                                <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:40px 30px;text-align:center;">
                                    <div style="font-size:48px;margin-bottom:8px;">🎉</div>
                                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Bem-vindo!</h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding:40px 30px;">
                                    <h2 style="color:#0f172a;margin:0 0 16px;font-size:20px;">Olá, ${nome}! 👋</h2>
                                    
                                    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                                        Sua conta na empresa <strong>${nomeEmpresa}</strong> foi criada com sucesso!
                                    </p>
                                    
                                    <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:24px 0;">
                                        <p style="color:#1e40af;font-size:14px;margin:0 0 8px;font-weight:600;">
                                            🔑 Código da Empresa
                                        </p>
                                        <div style="font-size:28px;font-weight:800;letter-spacing:4px;color:#2563eb;font-family:'Courier New',monospace;">
                                            ${codigoEmpresa}
                                        </div>
                                        <p style="color:#64748b;font-size:13px;margin:8px 0 0;">
                                            Compartilhe este código com outros funcionários
                                        </p>
                                    </div>
                                    
                                    <p style="color:#475569;font-size:16px;line-height:1.6;margin:24px 0 0;">
                                        Agora você pode começar a gerenciar suas ordens de serviço!
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="background:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
                                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                                        © 2024 Gestão OS - Todos os direitos reservados
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

// ==========================================
// ENVIAR EMAIL DE VERIFICAÇÃO
// ==========================================
async function enviarEmailVerificacao(email, codigo) {
    // MODO DESENVOLVIMENTO: Se não tiver configurado email, apenas loga
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'seu-email@gmail.com') {
        console.log('\n========================================');
        console.log('📧 MODO DESENVOLVIMENTO - EMAIL NÃO ENVIADO');
        console.log('========================================');
        console.log(`Para: ${email}`);
        console.log(`Código: ${codigo}`);
        console.log('========================================\n');
        return { success: true, devMode: true, codigo };
    }

    // MODO PRODUÇÃO: Envia email real
    try {
        const transporter = criarTransporter();
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Gestão OS <noreply@gestaoos.com>',
            to: email,
            subject: '🔐 Código de Verificação - Gestão OS',
            html: templateVerificacao(codigo)
        });

        console.log(`✅ Email enviado para ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error.message);
        // Em caso de erro, ainda permite continuar em desenvolvimento
        console.log(`📧 CÓDIGO PARA ${email}: ${codigo}`);
        return { success: true, error: error.message, codigo };
    }
}

// ==========================================
// ENVIAR EMAIL DE BOAS-VINDAS
// ==========================================
async function enviarEmailBoasVindas(email, nome, nomeEmpresa, codigoEmpresa) {
    // Modo desenvolvimento
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'seu-email@gmail.com') {
        console.log(`📧 [DEV] Email de boas-vindas para ${email}`);
        return { success: true, devMode: true };
    }

    try {
        const transporter = criarTransporter();
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `🎉 Bem-vindo à ${nomeEmpresa}!`,
            html: templateBoasVindas(nome, nomeEmpresa, codigoEmpresa)
        });

        console.log(`✅ Email de boas-vindas enviado para ${email}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erro ao enviar email de boas-vindas:', error.message);
        return { success: false, error: error.message };
    }
}

// ==========================================
// EXPORTAR FUNÇÕES
// ==========================================
module.exports = {
    criarTransporter,
    enviarEmailVerificacao,
    enviarEmailBoasVindas,
    templateVerificacao,
    templateBoasVindas
};