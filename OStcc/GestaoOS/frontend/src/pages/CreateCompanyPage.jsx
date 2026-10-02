import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Copy,
  Layers,
} from 'lucide-react';


export default function CreateCompanyPage() {
  const [form, setForm] = useState({
    empresa: '',
    admin: '',
    email: '',
    senha: '',
  });

  const [loading, setLoading] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [resultado, setResultado] =
    useState(null);

  const [copiado, setCopiado] =
    useState(false);


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const response = await fetch(
        'http://127.0.0.1:3000/api/auth/criar-empresa',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(form),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro ||
          data.message ||
          'Não foi possível criar a empresa.',
        );
      }

      setResultado(data);

    } catch (error) {
      setErro(error.message);

    } finally {
      setLoading(false);
    }
  }


  async function copiarCodigo() {
    if (!resultado?.codigo) {
      return;
    }

    await navigator.clipboard.writeText(
      resultado.codigo,
    );

    setCopiado(true);

    setTimeout(
      () => setCopiado(false),
      2000,
    );
  }


  if (resultado) {
    return (
      <div style={styles.page}>

        <div style={styles.box}>

          <div style={styles.logo}>
            <Layers size={22} />

            <strong>
              GestãoOS
            </strong>
          </div>


          <div style={styles.successIcon}>
            <CheckCircle2 size={30} />
          </div>


          <h1 style={styles.title}>
            Empresa criada com sucesso
          </h1>


          <p style={styles.subtitle}>
            Seu ambiente no GestãoOS já
            foi criado.
          </p>


          <div style={styles.codeBox}>

            <span style={styles.codeLabel}>
              CÓDIGO DA EMPRESA
            </span>


            <strong style={styles.code}>
              {resultado.codigo}
            </strong>


            <button
              style={styles.copyButton}
              onClick={copiarCodigo}
              type="button"
            >
              <Copy size={17} />

              {
                copiado
                  ? 'Copiado!'
                  : 'Copiar código'
              }
            </button>

          </div>


          <p style={styles.warning}>
            Guarde este código. Ele identifica
            a sua empresa dentro do GestãoOS.
          </p>


          <Link
            to="/login"
            style={styles.primaryButton}
          >
            Ir para o login
          </Link>

        </div>

      </div>
    );
  }


  return (
    <div style={styles.page}>

      <div style={styles.wrapper}>

        <Link
          to="/"
          style={styles.back}
        >
          <ArrowLeft size={17} />

          Voltar para o início
        </Link>


        <div style={styles.box}>

          <div style={styles.logo}>
            <Layers size={22} />

            <strong>
              GestãoOS
            </strong>
          </div>


          <div style={styles.companyIcon}>
            <Building2 size={27} />
          </div>


          <h1 style={styles.title}>
            Criar empresa
          </h1>


          <p style={styles.subtitle}>
            Crie o ambiente da sua empresa
            e cadastre o primeiro administrador
            do sistema.
          </p>


          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >

            <label style={styles.field}>

              <span>
                Nome da empresa
              </span>

              <input
                style={styles.input}
                type="text"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                placeholder="Ex: Empresa Exemplo"
                required
              />

            </label>


            <label style={styles.field}>

              <span>
                Nome do administrador
              </span>

              <input
                style={styles.input}
                type="text"
                name="admin"
                value={form.admin}
                onChange={handleChange}
                placeholder="Nome completo"
                required
              />

            </label>


            <label style={styles.field}>

              <span>
                E-mail
              </span>

              <input
                style={styles.input}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@empresa.com"
                required
              />

            </label>


            <label style={styles.field}>

              <span>
                Senha
              </span>

              <input
                style={styles.input}
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="Mínimo 10 caracteres"
                minLength={10}
                required
              />

            </label>


            {
              erro && (
                <div style={styles.error}>
                  {erro}
                </div>
              )
            }


            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryButton,

                border: 0,

                cursor:
                  loading
                    ? 'wait'
                    : 'pointer',

                opacity:
                  loading
                    ? 0.7
                    : 1,
              }}
            >
              {
                loading
                  ? 'Criando empresa...'
                  : 'Criar empresa'
              }
            </button>

          </form>


          <div style={styles.loginText}>

            Já possui uma empresa?

            {' '}

            <Link
              to="/login"
              style={styles.loginLink}
            >
              Acessar sistema
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}


const styles = {
  page: {
    minHeight: '100vh',

    display: 'flex',

    justifyContent: 'center',

    alignItems: 'flex-start',

    padding: '50px 20px',

    background: '#f5f7fa',

    color: '#1f2937',

    boxSizing: 'border-box',
  },


  wrapper: {
    width: '100%',

    maxWidth: '540px',
  },


  back: {
    display: 'inline-flex',

    alignItems: 'center',

    gap: '7px',

    marginBottom: '18px',

    color: '#64748b',

    textDecoration: 'none',

    fontSize: '14px',

    fontWeight: 600,
  },


  box: {
    width: '100%',

    maxWidth: '540px',

    padding: '38px',

    background: '#ffffff',

    border: '1px solid #e2e8f0',

    borderRadius: '18px',

    boxShadow:
      '0 20px 50px rgba(15, 23, 42, 0.08)',

    boxSizing: 'border-box',
  },


  logo: {
    display: 'flex',

    alignItems: 'center',

    gap: '8px',

    marginBottom: '28px',

    color: '#1f2937',

    fontSize: '18px',
  },


  companyIcon: {
    width: '52px',

    height: '52px',

    display: 'grid',

    placeItems: 'center',

    marginBottom: '20px',

    borderRadius: '14px',

    background: '#eef4ff',

    color: '#2563eb',
  },


  successIcon: {
    width: '58px',

    height: '58px',

    display: 'grid',

    placeItems: 'center',

    marginBottom: '20px',

    borderRadius: '50%',

    background: '#ecfdf3',

    color: '#16a34a',
  },


  title: {
    margin: '0',

    fontSize: '30px',

    lineHeight: 1.15,

    color: '#172033',
  },


  subtitle: {
    marginTop: '11px',

    marginBottom: '28px',

    color: '#718096',

    lineHeight: 1.65,

    fontSize: '14px',
  },


  form: {
    display: 'grid',

    gap: '18px',
  },


  field: {
    display: 'grid',

    gap: '7px',

    fontSize: '13px',

    fontWeight: 700,

    color: '#334155',
  },


  input: {
    width: '100%',

    minHeight: '47px',

    padding: '0 14px',

    boxSizing: 'border-box',

    border: '1px solid #d9e0e8',

    borderRadius: '10px',

    outline: 'none',

    background: '#ffffff',

    color: '#172033',

    fontSize: '14px',
  },


  primaryButton: {
    width: '100%',

    minHeight: '48px',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: '5px',

    borderRadius: '10px',

    background: '#2563eb',

    color: '#ffffff',

    fontSize: '14px',

    fontWeight: 700,

    textDecoration: 'none',

    boxSizing: 'border-box',
  },


  error: {
    padding: '11px 13px',

    border: '1px solid #fecaca',

    borderRadius: '9px',

    background: '#fef2f2',

    color: '#b91c1c',

    fontSize: '13px',
  },


  loginText: {
    marginTop: '22px',

    textAlign: 'center',

    color: '#7c8797',

    fontSize: '13px',
  },


  loginLink: {
    color: '#2563eb',

    fontWeight: 700,

    textDecoration: 'none',
  },


  codeBox: {
    padding: '25px',

    margin: '25px 0 15px',

    textAlign: 'center',

    background: '#f8fafc',

    border: '1px solid #e2e8f0',

    borderRadius: '14px',
  },


  codeLabel: {
    display: 'block',

    marginBottom: '8px',

    color: '#64748b',

    fontSize: '11px',

    fontWeight: 800,

    letterSpacing: '1.2px',
  },


  code: {
    display: 'block',

    marginBottom: '17px',

    color: '#172033',

    fontSize: '27px',

    letterSpacing: '2px',
  },


  copyButton: {
    display: 'inline-flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '7px',

    minHeight: '39px',

    padding: '0 15px',

    border: '1px solid #dbe2ea',

    borderRadius: '9px',

    background: '#ffffff',

    color: '#334155',

    fontWeight: 700,

    cursor: 'pointer',
  },


  warning: {
    marginBottom: '22px',

    color: '#64748b',

    fontSize: '13px',

    lineHeight: 1.6,
  },
};