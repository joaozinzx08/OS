import { useLocation, useNavigate } from "react-router-dom";

export default function CompanyCreatedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const codigo = location.state?.codigo;
  const empresa = location.state?.empresa;

  function copiarCodigo() {
    if (!codigo) return;

    navigator.clipboard.writeText(codigo);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Empresa criada</h1>

          <p>
            Sua empresa foi cadastrada com sucesso.
          </p>
        </div>

        <div className="company-code-box">
          <span>Código da empresa</span>

          <strong>
            {codigo || "Código não encontrado"}
          </strong>

          <button
            className="btn secondary"
            onClick={copiarCodigo}
          >
            Copiar código
          </button>
        </div>

        {empresa && (
          <p>
            Empresa: <strong>{empresa}</strong>
          </p>
        )}

        <button
          className="btn primary"
          onClick={() => navigate("/login")}
        >
          Ir para o login
        </button>
      </div>
    </div>
  );
}