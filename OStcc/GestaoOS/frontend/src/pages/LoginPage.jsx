import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Layers, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage, Field } from '../components/ui';

export default function LoginPage() {
  const { usuario, login, error: connectionError } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  if (usuario) return <Navigate to="/painel" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await login({ email: form.get('email'), senha: form.get('senha') });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-story">
        <Link className="brand" to="/"><span className="brand-mark"><Layers size={23} /></span>Gestão<span className="brand-os">OS</span></Link>
        <div className="login-story-content">
          <div className="eyebrow">ORDENS NO LUGAR CERTO. EQUIPE NO MESMO FLUXO.</div>
          <h1>Solicitar.<br />Atender. Concluir.</h1>
          <p>Gerencie ordens de serviço internas com setor, prioridade, prazo, responsável e histórico em um único ambiente.</p>
          <div className="story-points">
            {[
              'Ordens encaminhadas por setor',
              'Prioridades, prazos e responsáveis',
              'Ambiente isolado para cada empresa',
            ].map(text => <div key={text}><Check size={17} />{text}</div>)}
          </div>
          <div className="story-card">
            <div><span className="status-dot" /> DO REGISTRO À CONCLUSÃO</div>
            <div className="story-flow"><span>Abrir OS</span><ArrowRight size={18} /><span>Atender</span><ArrowRight size={18} /><span>Concluir</span></div>
          </div>
        </div>
        <small>GestãoOS · Gestão de ordens de serviço empresarial.</small>
      </section>

      <section className="login-form-area">
        <Link className="login-back" to="/"><ArrowLeft size={15} />Voltar para o site</Link>
        <div className="login-form">
          <div className="eyebrow">ACESSO AO AMBIENTE DA EMPRESA</div>
          <h2>Entre no GestãoOS</h2>
          <p>Use os dados fornecidos pela administração da sua empresa.</p>
          <ErrorMessage message={error || connectionError} />
          <form onSubmit={submit}>
            <Field label="E-mail"><input name="email" type="email" autoComplete="username" placeholder="voce@empresa.com" required /></Field>
            <Field label="Senha">
              <div className="password-input">
                <input name="senha" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required />
                <button type="button" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </Field>
            <button className="btn primary login-submit" disabled={busy}>{busy ? 'Entrando...' : 'Acessar ambiente'}<ArrowRight size={18} /></button>
          </form>
          <div className="login-help">Precisa de acesso ou esqueceu a senha?<br /><strong>Fale com o administrador da sua empresa.</strong></div>
        </div>
        <small className="login-caption">GestãoOS · Cada ordem com seu contexto.</small>
      </section>
    </div>
  );
}
