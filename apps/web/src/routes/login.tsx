import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@beverage/shared';
import { SBtn, SolIcon } from '../components/sol';
import { api, apiErrorMessage } from '../lib/api';
import { isAuthenticated, setSession, type SessionUser } from '../lib/auth';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: '/pos' });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<{ accessToken: string; user: SessionUser }>(
        '/auth/login',
        input,
      );
      return data;
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      void navigate({ to: '/pos' });
    },
  });

  return (
    <div className="s-login">
      <div className="s-login-brand">
        <div className="s-login-halo" />
        <div className="s-login-halo is-2" />
        <div style={{ position: 'relative' }}>
          <span className="s-logo-mark" style={{ width: 56, height: 56 }}>
            <SolIcon name="sun" size={30} />
          </span>
          <div style={{ fontSize: 30, lineHeight: 1.2, marginTop: 20, fontWeight: 400 }}>
            Distribuidora
            <br />
            <b style={{ letterSpacing: 4, fontWeight: 800 }}>SOL</b>
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 14, maxWidth: 240, lineHeight: 1.5 }}>
            Vendas, estoque e financeiro num lugar só.
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 12, opacity: 0.45 }}>v1.0 · MVP</div>
      </div>
      <div className="s-login-side">
        <form className="s-login-form" onSubmit={handleSubmit((data) => login.mutate(data))}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sol-900)' }}>
            Bem-vindo de volta
          </div>
          <div className="s-dim" style={{ fontSize: 13.5, marginTop: 4, marginBottom: 26 }}>
            Entre com sua conta para abrir o caixa.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="s-label">Usuário</div>
              <div className="s-input">
                <input placeholder="seu login" aria-label="Usuário" autoFocus {...register('login')} />
              </div>
              {errors.login && <div className="s-error">{errors.login.message}</div>}
            </div>
            <div>
              <div className="s-label">Senha</div>
              <div className="s-input">
                <input type="password" placeholder="••••••••" aria-label="Senha" {...register('password')} />
              </div>
              {errors.password && <div className="s-error">{errors.password.message}</div>}
            </div>
            {login.isError && <div className="s-error">{apiErrorMessage(login.error)}</div>}
            <SBtn primary big type="submit" disabled={login.isPending} style={{ marginTop: 8 }}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </SBtn>
            <span
              style={{ fontSize: 13, textAlign: 'center', color: 'var(--accent-deep)', fontWeight: 600 }}
            >
              Esqueci minha senha
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
