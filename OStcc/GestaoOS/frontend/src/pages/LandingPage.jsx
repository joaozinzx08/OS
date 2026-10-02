import { useState } from 'react';

import { Link } from 'react-router-dom';

import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  ShieldCheck,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import './LandingPage.css';


const resources = [
  {
    icon: Building2,
    title: 'Multiempresa de verdade',
    text: 'Cada empresa possui seu próprio ambiente, com usuários, setores, categorias e ordens de serviço isolados.',
  },

  {
    icon: Workflow,
    title: 'Fluxo por setor',
    text: 'A ordem é registrada, classificada e encaminhada para a equipe responsável, sem depender de mensagens soltas.',
  },

  {
    icon: Gauge,
    title: 'Prioridades e prazos',
    text: 'Status, prioridade, responsável e prazo ficam visíveis para facilitar o acompanhamento do atendimento.',
  },

  {
    icon: LayoutDashboard,
    title: 'Painel operacional',
    text: 'Indicadores mostram o que está aberto, em atendimento, concluído e o que já passou do prazo.',
  },

  {
    icon: BellRing,
    title: 'Notificações internas',
    text: 'Atualizações importantes chegam dentro do sistema para manter solicitantes e responsáveis informados.',
  },

  {
    icon: ShieldCheck,
    title: 'Histórico e auditoria',
    text: 'Mudanças de status, comentários e ações administrativas ficam registradas para dar rastreabilidade ao processo.',
  },
];


const profiles = [
  [
    'Administrador principal',
    'Configura a empresa, setores, categorias, usuários e acompanha a auditoria.',
  ],

  [
    'Administrador de setor',
    'Gerencia colaboradores e gestores do próprio setor e acompanha as ordens da área.',
  ],

  [
    'Gestor',
    'Atende ordens do setor, assume responsabilidades e atualiza o andamento do serviço.',
  ],

  [
    'Colaborador',
    'Abre ordens de serviço e acompanha suas próprias solicitações até a conclusão.',
  ],
];


const flow = [
  [
    '01',
    'Registrar',
    'O colaborador descreve a necessidade, escolhe setor, categoria e prioridade.',
  ],

  [
    '02',
    'Encaminhar',
    'A ordem entra no escopo do setor responsável e fica disponível para a gestão da área.',
  ],

  [
    '03',
    'Atender',
    'Gestor ou administrador define responsável, prazo e atualiza o status do atendimento.',
  ],

  [
    '04',
    'Acompanhar',
    'Comentários, alterações e notificações mantêm todo o contexto no mesmo lugar.',
  ],

  [
    '05',
    'Concluir',
    'A ordem é finalizada e o histórico permanece disponível para consulta e auditoria.',
  ],
];


export default function LandingPage() {
  const { usuario, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const accessPath = usuario
    ? '/painel'
    : '/login';

  const accessLabel = usuario
    ? 'Ir para o painel'
    : 'Acessar sistema';


  function closeMenu() {
    setMenuOpen(false);
  }


  return (
    <div className="public-site">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <header className="public-header">

        <div className="public-container public-nav">

          <Link
            className="public-brand"
            to="/"
            onClick={closeMenu}
            aria-label="GestãoOS - início"
          >
            <span className="public-brand-mark">
              <Layers size={21} />
            </span>

            <span>
              Gestão<strong>OS</strong>
            </span>
          </Link>


          <button
            className="public-menu-button"
            type="button"
            aria-label={
              menuOpen
                ? 'Fechar menu'
                : 'Abrir menu'
            }
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen(
                value => !value,
              )
            }
          >
            {
              menuOpen
                ? <X size={21} />
                : <Menu size={21} />
            }
          </button>


          <nav
            className={
              menuOpen
                ? 'public-links is-open'
                : 'public-links'
            }
            aria-label="Navegação principal"
          >

            <a
              href="#recursos"
              onClick={closeMenu}
            >
              Recursos
            </a>

            <a
              href="#como-funciona"
              onClick={closeMenu}
            >
              Como funciona
            </a>

            <a
              href="#perfis"
              onClick={closeMenu}
            >
              Perfis
            </a>

            <a
              href="#seguranca"
              onClick={closeMenu}
            >
              Segurança
            </a>

            <a
              href="#sobre"
              onClick={closeMenu}
            >
              Sobre
            </a>

          </nav>


          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >

            {!usuario && (
              <Link
                className="public-access"
                to="/criar-empresa"
              >
                Criar empresa

                <Building2 size={16} />
              </Link>
            )}


            <Link
              className="public-access"
              to={accessPath}
            >
              {
                loading
                  ? 'Carregando...'
                  : accessLabel
              }

              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </header>


      <main>

        {/* ========================= */}
        {/* HERO */}
        {/* ========================= */}

        <section className="public-hero">

          <div className="public-container public-hero-grid">

            <div className="public-hero-copy">

              <div className="public-kicker">
                <span />

                PLATAFORMA MULTIEMPRESA
              </div>


              <h1>
                Ordens de serviço organizadas.

                <span>
                  {' '}
                  Atendimento com contexto.
                </span>
              </h1>


              <p>
                O GestãoOS centraliza solicitações
                e ocorrências internas, encaminha
                cada ordem ao setor responsável e
                mantém prioridade, prazo,
                responsável e histórico em um
                único ambiente.
              </p>


              <div className="public-hero-actions">

                <Link
                  className="public-primary"
                  to={accessPath}
                >
                  {accessLabel}

                  <ArrowRight size={17} />
                </Link>


                {!usuario && (
                  <Link
                    className="public-secondary"
                    to="/criar-empresa"
                  >
                    Criar empresa
                  </Link>
                )}


                <a
                  className="public-secondary"
                  href="#como-funciona"
                >
                  Entender o fluxo
                </a>

              </div>


              <div className="public-proof">

                <div>
                  <strong>
                    4
                  </strong>

                  <span>
                    perfis de acesso
                  </span>
                </div>


                <div>
                  <strong>
                    1
                  </strong>

                  <span>
                    histórico por ordem
                  </span>
                </div>


                <div>
                  <strong>
                    100%
                  </strong>

                  <span>
                    separado por empresa
                  </span>
                </div>

              </div>

            </div>


            {/* ========================= */}
            {/* PREVIEW */}
            {/* ========================= */}

            <div
              className="public-hero-visual"
              aria-label="Prévia conceitual do painel GestãoOS"
            >

              <div className="public-preview">

                <div className="public-preview-top">

                  <div className="public-preview-brand">

                    <span>
                      <Layers size={15} />
                    </span>

                    GestãoOS

                  </div>


                  <div className="public-preview-user">
                    Empresa / Unidade
                  </div>

                </div>


                <div className="public-preview-summary">

                  <div>
                    <span>
                      Abertas
                    </span>

                    <strong>
                      12
                    </strong>
                  </div>


                  <div>
                    <span>
                      Em atendimento
                    </span>

                    <strong>
                      07
                    </strong>
                  </div>


                  <div>
                    <span>
                      Concluídas
                    </span>

                    <strong>
                      28
                    </strong>
                  </div>


                  <div>
                    <span>
                      Prazo vencido
                    </span>

                    <strong>
                      03
                    </strong>
                  </div>

                </div>


                <div className="public-preview-panel">

                  <div className="public-preview-heading">

                    <div>
                      <strong>
                        Ordens recentes
                      </strong>

                      <span>
                        Atendimento por setor
                      </span>
                    </div>


                    <span className="public-preview-filter">
                      Todos os setores
                    </span>

                  </div>


                  <div className="public-order-row">

                    <div className="public-order-main">

                      <small>
                        OS-026-8D7F
                      </small>

                      <strong>
                        Computador da recepção
                        não inicia
                      </strong>

                    </div>


                    <span>
                      Tecnologia
                    </span>


                    <b className="public-status amber">
                      Em atendimento
                    </b>


                    <b className="public-status red">
                      Alta
                    </b>

                  </div>


                  <div className="public-order-row">

                    <div className="public-order-main">

                      <small>
                        OS-026-A3D5
                      </small>

                      <strong>
                        Atualizar computadores
                        do laboratório
                      </strong>

                    </div>


                    <span>
                      Tecnologia
                    </span>


                    <b className="public-status blue">
                      Aberta
                    </b>


                    <b className="public-status gray">
                      Média
                    </b>

                  </div>


                  <div className="public-order-row">

                    <div className="public-order-main">

                      <small>
                        OS-026-4749
                      </small>

                      <strong>
                        Instalar equipamento
                        na sala de reunião
                      </strong>

                    </div>


                    <span>
                      Manutenção
                    </span>


                    <b className="public-status green">
                      Concluída
                    </b>


                    <b className="public-status gray">
                      Baixa
                    </b>

                  </div>

                </div>

              </div>


              <div className="public-float public-float-left">

                <span className="public-float-icon">
                  <CheckCircle2 size={17} />
                </span>


                <div>
                  <strong>
                    Histórico atualizado
                  </strong>

                  <small>
                    cada mudança fica registrada
                  </small>
                </div>

              </div>


              <div className="public-float public-float-right">

                <span className="public-float-icon lock">
                  <LockKeyhole size={17} />
                </span>


                <div>
                  <strong>
                    Ambiente isolado
                  </strong>

                  <small>
                    dados separados por empresa
                  </small>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* PILARES */}
        {/* ========================= */}

        <section
          className="public-strip"
          aria-label="Pilares do GestãoOS"
        >

          <div className="public-container public-strip-grid">

            <div>

              <Building2 size={18} />

              <span>
                <strong>
                  Multiempresa
                </strong>

                {' '}
                ambientes independentes
              </span>

            </div>


            <div>

              <ClipboardList size={18} />

              <span>
                <strong>
                  Ordens de serviço
                </strong>

                {' '}
                do registro à conclusão
              </span>

            </div>


            <div>

              <ShieldCheck size={18} />

              <span>
                <strong>
                  Rastreabilidade
                </strong>

                {' '}
                histórico e auditoria
              </span>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* RECURSOS */}
        {/* ========================= */}

        <section
          className="public-section"
          id="recursos"
        >

          <div className="public-container">

            <div className="public-section-heading">

              <div className="public-kicker">
                <span />

                RECURSOS
              </div>


              <h2>
                Gestão interna organizada
                do início ao fim.
              </h2>


              <p>
                O sistema foi pensado para
                substituir pedidos espalhados
                por mensagens, e-mails e
                anotações por um fluxo único
                de atendimento interno.
              </p>

            </div>


            <div className="public-resource-grid">

              {
                resources.map(
                  ({
                    icon: Icon,
                    title,
                    text,
                  }) => (

                    <article
                      className="public-resource-card"
                      key={title}
                    >

                      <span className="public-resource-icon">
                        <Icon size={20} />
                      </span>


                      <h3>
                        {title}
                      </h3>


                      <p>
                        {text}
                      </p>

                    </article>

                  ),
                )
              }

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* COMO FUNCIONA */}
        {/* ========================= */}

        <section
          className="public-section public-flow-section"
          id="como-funciona"
        >

          <div className="public-container">

            <div className="public-section-heading public-flow-heading">

              <div className="public-kicker">
                <span />

                COMO FUNCIONA
              </div>


              <h2>
                Da abertura da OS à conclusão.
              </h2>


              <p>
                Um fluxo simples o bastante para
                o colaborador e estruturado o
                bastante para quem gerencia
                o atendimento.
              </p>

            </div>


            <div className="public-flow">

              {
                flow.map(
                  ([
                    number,
                    title,
                    text,
                  ]) => (

                    <article key={number}>

                      <span className="public-flow-number">
                        {number}
                      </span>


                      <div>

                        <h3>
                          {title}
                        </h3>


                        <p>
                          {text}
                        </p>

                      </div>

                    </article>

                  ),
                )
              }

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* PERFIS */}
        {/* ========================= */}

        <section
          className="public-section"
          id="perfis"
        >

          <div className="public-container public-profiles-layout">

            <div className="public-profiles-copy">

              <div className="public-kicker">
                <span />

                PERFIS DE ACESSO
              </div>


              <h2>
                Cada pessoa vê e faz apenas
                o que precisa.
              </h2>


              <p>
                A estrutura de permissões
                acompanha a organização da
                empresa. O colaborador solicita,
                a gestão do setor atende e a
                administração mantém a estrutura
                e a governança do sistema.
              </p>


              <div className="public-profile-note">

                <UsersRound size={19} />

                Quatro perfis com
                responsabilidades diferentes.

              </div>

            </div>


            <div className="public-profile-list">

              {
                profiles.map(
                  ([
                    title,
                    text,
                  ], index) => (

                    <article key={title}>

                      <span>
                        0{index + 1}
                      </span>


                      <div>

                        <h3>
                          {title}
                        </h3>


                        <p>
                          {text}
                        </p>

                      </div>

                    </article>

                  ),
                )
              }

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* SEGURANÇA */}
        {/* ========================= */}

        <section
          className="public-section public-security-section"
          id="seguranca"
        >

          <div className="public-container public-security-card">

            <div className="public-security-copy">

              <div className="public-kicker light">
                <span />

                SEGURANÇA E CONTROLE
              </div>


              <h2>
                Uma empresa não enxerga
                os dados da outra.
              </h2>


              <p>
                Usuários, setores, categorias,
                ordens, notificações e registros
                de auditoria são associados ao
                ambiente da empresa. O acesso
                às funções também é limitado
                pelo perfil do usuário.
              </p>


              <Link
                to={accessPath}
                className="public-security-link"
              >
                Acessar meu ambiente

                <ArrowRight size={17} />
              </Link>

            </div>


            <div className="public-security-list">

              <div>

                <ShieldCheck size={20} />

                <span>

                  <strong>
                    Autorização por perfil
                  </strong>

                  <small>
                    Permissões diferentes
                    para cada função.
                  </small>

                </span>

              </div>


              <div>

                <Building2 size={20} />

                <span>

                  <strong>
                    Isolamento por empresa
                  </strong>

                  <small>
                    Dados operacionais separados
                    por ambiente.
                  </small>

                </span>

              </div>


              <div>

                <LockKeyhole size={20} />

                <span>

                  <strong>
                    Sessão protegida
                  </strong>

                  <small>
                    Autenticação e validação
                    no servidor.
                  </small>

                </span>

              </div>


              <div>

                <ClipboardList size={20} />

                <span>

                  <strong>
                    Auditoria
                  </strong>

                  <small>
                    Ações administrativas
                    registradas para consulta.
                  </small>

                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* SOBRE */}
        {/* ========================= */}

        <section
          className="public-section"
          id="sobre"
        >

          <div className="public-container public-about">

            <div>

              <div className="public-kicker">
                <span />

                SOBRE O GESTÃOOS
              </div>


              <h2>
                Gestão de ordens de serviço
                empresarial sem perder
                o contexto.
              </h2>

            </div>


            <div>

              <p>
                O GestãoOS foi criado para
                centralizar demandas internas
                e facilitar a comunicação entre
                quem solicita e quem resolve.
                O foco não é apenas abrir
                chamados: é organizar o processo,
                mostrar responsabilidades e
                manter um histórico confiável
                de cada atendimento.
              </p>


              <p>
                A plataforma foi estruturada
                para empresas que precisam
                organizar solicitações internas,
                distribuir responsabilidades
                e acompanhar cada etapa do
                atendimento com mais clareza
                e rastreabilidade.
              </p>

            </div>

          </div>

        </section>


        {/* ========================= */}
        {/* CTA */}
        {/* ========================= */}

        <section className="public-cta-section">

          <div className="public-container public-cta-card">

            <div>

              <span>
                GESTÃOOS
              </span>


              <h2>
                Solicitar. Encaminhar.
                Atender. Acompanhar.
              </h2>


              <p>
                Entre no ambiente da sua empresa
                e continue o fluxo por dentro
                da plataforma.
              </p>

            </div>


            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >

              {!usuario && (
                <Link
                  className="public-cta-button"
                  to="/criar-empresa"
                >
                  Criar empresa

                  <Building2 size={18} />
                </Link>
              )}


              <Link
                className="public-cta-button"
                to={accessPath}
              >
                {accessLabel}

                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </section>

      </main>


      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}

      <footer className="public-footer">

        <div className="public-container public-footer-content">

          <div className="public-footer-brand">

            <Layers size={18} />

            <strong>
              GestãoOS
            </strong>

            <span>
              Gestão de ordens de serviço
              empresarial
            </span>

          </div>


          <p>
            Projeto GestãoOS · 2026
          </p>

        </div>

      </footer>

    </div>
  );
}