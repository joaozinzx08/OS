import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import { Loading, Empty } from './components/ui';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CreateCompanyPage from './pages/CreateCompanyPage';

import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import CatalogPage from './pages/CatalogPage';
import ProfilePage from './pages/ProfilePage';
import ActivityPage from './pages/ActivityPage';

function Protected({ roles }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}

function Login() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (usuario) {
    return <Navigate to="/painel" replace />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ========================= */}
          {/* ROTAS PÚBLICAS */}
          {/* ========================= */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/criar-empresa"
            element={<CreateCompanyPage />}
          />


          {/* ========================= */}
          {/* ÁREA PROTEGIDA */}
          {/* ========================= */}

          <Route element={<Protected />}>
            <Route element={<Layout />}>

              <Route
                path="painel"
                element={<DashboardPage />}
              />

              <Route
                path="ordens"
                element={<OrdersPage />}
              />

              <Route
                path="ordens/nova"
                element={<NewOrderPage />}
              />

              <Route
                path="ordens/:id"
                element={<OrderDetailPage />}
              />

              <Route
                path="perfil"
                element={<ProfilePage />}
              />

              <Route
                path="notificacoes"
                element={<ActivityPage />}
              />


              {/* ========================= */}
              {/* ADMINISTRADORES */}
              {/* ========================= */}

              <Route
                element={
                  <Protected
                    roles={[
                      'administrador_principal',
                      'administrador_setor',
                    ]}
                  />
                }
              >
                <Route
                  path="usuarios"
                  element={<UsersPage />}
                />
              </Route>


              {/* ========================= */}
              {/* ADMIN PRINCIPAL */}
              {/* ========================= */}

              <Route
                element={
                  <Protected
                    roles={[
                      'administrador_principal',
                    ]}
                  />
                }
              >
                <Route
                  path="setores"
                  element={
                    <CatalogPage
                      key="setores"
                      type="setores"
                    />
                  }
                />

                <Route
                  path="categorias"
                  element={
                    <CatalogPage
                      key="categorias"
                      type="categorias"
                    />
                  }
                />

                <Route
                  path="auditoria"
                  element={
                    <ActivityPage
                      key="audit"
                      audit
                    />
                  }
                />
              </Route>


              {/* ========================= */}
              {/* 404 INTERNO */}
              {/* ========================= */}

              <Route
                path="*"
                element={
                  <>
                    <Empty title="Página não encontrada" />

                    <Link
                      className="btn secondary"
                      to="/painel"
                    >
                      Voltar ao painel
                    </Link>
                  </>
                }
              />

            </Route>
          </Route>


          {/* ========================= */}
          {/* 404 PÚBLICO */}
          {/* ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}