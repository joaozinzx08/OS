(function(){

        // ==========================================
        // ELEMENTOS
        // ==========================================
        const nomeInput = document.getElementById('nome');
        const respInput = document.getElementById('responsavel');
        const emailInput = document.getElementById('email');
        const senhaInput = document.getElementById('senha');
        const senha2Input = document.getElementById('senha2');
        const aceitarTermos = document.getElementById('aceitar-termos');
        const btnCriar = document.getElementById('btn-criar');
        const btnCriarTexto = document.getElementById('btn-criar-texto');
        const msgErro = document.getElementById('msg-erro');
        const msgSucesso = document.getElementById('msg-sucesso');
        const toggleSenha = document.getElementById('toggle-senha');
        const toggleSenha2 = document.getElementById('toggle-senha2');
        const passwordStrength = document.getElementById('password-strength');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        const senhaMatch = document.getElementById('senha-match');

        // ==========================================
        // TOGGLE SENHA
        // ==========================================
        toggleSenha.addEventListener('click', function() {
            const isPassword = senhaInput.type === 'password';
            senhaInput.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? '🙈' : '👁️';
        });

        toggleSenha2.addEventListener('click', function() {
            const isPassword = senha2Input.type === 'password';
            senha2Input.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? '🙈' : '👁️';
        });

        // ==========================================
        // FORÇA DA SENHA
        // ==========================================
        senhaInput.addEventListener('input', function() {
            const senha = this.value;

            if (senha.length === 0) {
                passwordStrength.classList.remove('show');
                return;
            }

            passwordStrength.classList.add('show');

            let forca = 0;

            if (senha.length >= 6) forca++;
            if (senha.length >= 10) forca++;
            if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) forca++;
            if (/[0-9]/.test(senha)) forca++;
            if (/[^A-Za-z0-9]/.test(senha)) forca++;

            strengthFill.classList.remove('fraca', 'media', 'forte');
            strengthText.classList.remove('fraca', 'media', 'forte');

            if (forca <= 2) {
                strengthFill.classList.add('fraca');
                strengthText.classList.add('fraca');
                strengthText.textContent = '🔴 Senha fraca';
            } else if (forca <= 3) {
                strengthFill.classList.add('media');
                strengthText.classList.add('media');
                strengthText.textContent = '🟡 Senha média';
            } else {
                strengthFill.classList.add('forte');
                strengthText.classList.add('forte');
                strengthText.textContent = '🟢 Senha forte';
            }
        });

        // ==========================================
        // VERIFICAR SE AS SENHAS COINCIDEM
        // ==========================================
        senha2Input.addEventListener('input', function() {
            const s1 = senhaInput.value;
            const s2 = this.value;

            if (!s2) {
                senhaMatch.style.display = 'none';
                return;
            }

            senhaMatch.style.display = 'block';

            if (s1 === s2) {
                senhaMatch.style.color = 'var(--success)';
                senhaMatch.textContent = '✅ As senhas coincidem';
            } else {
                senhaMatch.style.color = 'var(--danger)';
                senhaMatch.textContent = '❌ As senhas não coincidem';
            }
        });

        // ==========================================
        // MENSAGENS
        // ==========================================
        function mostrarErro(msg) {
            msgSucesso.classList.remove('show');
            msgErro.textContent = msg;
            msgErro.classList.add('show');

            // Scroll até o erro
            msgErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function mostrarSucesso(msg) {
            msgErro.classList.remove('show');
            msgSucesso.innerHTML = msg;
            msgSucesso.classList.add('show');
        }

        // ==========================================
        // VALIDAÇÕES EM TEMPO REAL
        // ==========================================
        emailInput.addEventListener('blur', function() {
            if (this.value && !validarEmail(this.value)) {
                this.style.borderColor = 'var(--danger)';
            } else {
                this.style.borderColor = '';
            }
        });

        emailInput.addEventListener('input', function() {
            this.style.borderColor = '';
        });

        // ==========================================
        // CRIAR EMPRESA
        // ==========================================
        function criarEmpresa() {
            console.log('🚀 criarEmpresa() chamada');

            msgErro.classList.remove('show');
            msgSucesso.classList.remove('show');

            const nome = nomeInput.value.trim();
            const responsavel = respInput.value.trim();
            const email = emailInput.value.trim();
            const senha = senhaInput.value;
            const senha2 = senha2Input.value;

            // ===== VALIDAÇÕES =====
            if (!nome || nome.length < 2) {
                mostrarErro('⚠️ Informe o nome da empresa (mínimo 2 caracteres)');
                nomeInput.focus();
                return;
            }

            if (!responsavel || responsavel.length < 3) {
                mostrarErro('⚠️ Informe seu nome completo (mínimo 3 caracteres)');
                respInput.focus();
                return;
            }

            if (!email) {
                mostrarErro('⚠️ Informe um e-mail');
                emailInput.focus();
                return;
            }

            if (!validarEmail(email)) {
                mostrarErro('⚠️ Formato de e-mail inválido');
                emailInput.focus();
                return;
            }

            if (!senha) {
                mostrarErro('⚠️ Informe uma senha');
                senhaInput.focus();
                return;
            }

            if (senha.length < 8) {
                mostrarErro('⚠️ A senha deve ter no mínimo 8 caracteres');
                senhaInput.focus();
                return;
            }

            if (senha !== senha2) {
                mostrarErro('⚠️ As senhas não coincidem');
                senha2Input.focus();
                return;
            }

            if (!aceitarTermos.checked) {
                mostrarErro('⚠️ Você precisa aceitar os Termos de Uso e a Política de Privacidade');
                aceitarTermos.focus();
                return;
            }

            // ===== LOADING =====
            btnCriar.disabled = true;
            btnCriarTexto.innerHTML = '<span class="loading-spinner"></span>Criando sua empresa...';

            // ===== API =====
            apiRequest('/empresas', {
                method: 'POST',
                body: JSON.stringify({
                    nome: nome,
                    responsavel: responsavel,
                    email: email,
                    senha: senha
                })
            })
            .then(function(response) {
                

                // Salvar sessão
                localStorage.setItem('token', response.token);
                localStorage.setItem('usuario', JSON.stringify(response.usuario));
                localStorage.setItem('empresa', JSON.stringify(response.empresa));

                // Mostrar sucesso
                mostrarSucesso(
                    '🎉 <strong>Empresa criada com sucesso!</strong><br><br>' +
                    '🔑 Código da Empresa:<br>' +
                    '<span style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: var(--primary); background: white; padding: 4px 12px; border-radius: 6px; display: inline-block; margin: 8px 0;">' + 
                    response.empresa.codigo + 
                    '</span><br>' +
                    '<small style="opacity: 0.8;">Guarde este código para adicionar funcionários</small><br><br>' +
                    '⏳ Redirecionando para o dashboard...'
                );

                // Desabilitar interação
                nomeInput.disabled = true;
                respInput.disabled = true;
                emailInput.disabled = true;
                senhaInput.disabled = true;
                senha2Input.disabled = true;

                // Redirecionar
                setTimeout(function() {
                    window.location.href = 'admin/dashboard.html';
                }, 2500);
            })
            .catch(function(error) {
                console.error('❌ Erro:', error);

                let mensagem = error.message || 'Erro ao criar empresa';

                if (mensagem.includes('já está cadastrado')) {
                    mensagem = '⚠️ Este e-mail já está cadastrado. Use outro e-mail ou faça login.';
                } else if (mensagem.includes('conexão') || mensagem.includes('fetch')) {
                    mensagem = '🔌 Erro de conexão. Verifique se o servidor está rodando.';
                }

                mostrarErro(mensagem);

                btnCriar.disabled = false;
                btnCriarTexto.innerHTML = '✨ Criar Minha Empresa';
            });
        }

        // ==========================================
        // ENTER PARA ENVIAR
        // ==========================================
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !btnCriar.disabled) {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'INPUT') {
                    criarEmpresa();
                }
            }
        });

        // ==========================================
        // VERIFICAR SE JÁ ESTÁ LOGADO
        // ==========================================
        if (estaLogado()) {
            const user = getUsuario();
            if (user) {
                const dashboards = {
                    'administrador_principal': 'admin/dashboard.html',
                    'administrador_setor': 'admin/dashboard.html',
                    'gestor': 'gestor/dashboard.html',
                    'colaborador': 'colaborador/dashboard.html'
                };
                if (dashboards[user.role]) {
                    window.location.href = dashboards[user.role];
                }
            }
        }

        console.log('✅ criar-empresa.html carregado com sucesso!');
    
Object.assign(window,{mostrarErro,mostrarSucesso,criarEmpresa});
})();