import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { SolIcon, type IconName } from '../components/sol';
import { clearSession, getUser, isAuthenticated } from '../lib/auth';
import { Screen } from '../presentation/components/Screen';

export { Screen };

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: AppShell,
});

const NAV: { icon: IconName; label: string; to: string }[] = [
  { icon: 'pdv', label: 'PDV — Caixa', to: '/sale' },
  { icon: 'produtos', label: 'Produtos', to: '/products' },
  { icon: 'estoque', label: 'Estoque', to: '/stock' },
  { icon: 'financeiro', label: 'Financeiro', to: '/financial' },
  { icon: 'relatorios', label: 'Relatórios', to: '/reports' },
  { icon: 'config', label: 'Configurações', to: '/settings' },
];

function AppShell() {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div className="s-screen">
      <div className="s-sidebar">
        <div className="s-logo">
          <span className="s-logo-mark">
            <SolIcon name="sun" size={20} />
          </span>
          <span className="s-logo-text">
            Costas
            <br />
            <b>BAR</b>
          </span>
        </div>
        <nav className="s-nav">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="s-nav-item"
              activeProps={{ className: 's-nav-item is-active' }}
            >
              <SolIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="s-side-foot">
          <span className="s-avatar">{user?.name?.charAt(0).toUpperCase() ?? '?'}</span>
          <span>
            <span className="s-side-user">{user?.name ?? '—'}</span>
            <button
              className="s-side-out"
              onClick={() => {
                clearSession();
                void navigate({ to: '/login' });
              }}
            >
              sair
            </button>
          </span>
        </div>
      </div>
      <div className="s-main">
        <Outlet />
      </div>
    </div>
  );
}
