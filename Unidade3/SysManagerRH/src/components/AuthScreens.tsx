import React, { useState } from 'react';
import { ShieldAlert, LogOut, RefreshCw, Copy, Check, Lock } from 'lucide-react';

interface LoginScreenProps {
  isSigningIn: boolean;
  errorMessage: string | null;
  onSignIn: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isSigningIn,
  errorMessage,
  onSignIn,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-[#163459] bg-[#0F2744] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-base sm:text-lg font-semibold tracking-tight text-white">
            Sistema de Gestão de Colaboradores
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <Lock className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 text-balance">
            Entrar no painel de RH
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            O acesso aos colaboradores e às admissões é restrito a contas Google previamente autorizadas pela administração do projeto.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            disabled={isSigningIn}
            onClick={onSignIn}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors duration-150"
          >
            {isSigningIn ? 'Conectando com Google...' : 'Entrar com Google'}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Ao autenticar, o sistema confirma se o seu UID está cadastrado na lista de usuários autorizados antes de carregar qualquer dado.
          </p>
        </div>
      </main>
    </div>
  );
};

interface CheckingAuthScreenProps {
  message?: string;
}

export const CheckingAuthScreen: React.FC<CheckingAuthScreenProps> = ({
  message = 'Verificando permissão de acesso...',
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-[#163459] bg-[#0F2744] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-base sm:text-lg font-semibold tracking-tight text-white">
            Sistema de Gestão de Colaboradores
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center"
        >
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-800">{message}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            Aguardando confirmação da lista de usuários autorizados no Firestore.
          </p>
        </div>
      </main>
    </div>
  );
};

interface UnauthorizedScreenProps {
  uid: string;
  email: string | null;
  errorMessage: string | null;
  isRechecking: boolean;
  onRecheck: () => void;
  onSignOut: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
  uid,
  email,
  errorMessage,
  isRechecking,
  onRecheck,
  onSignOut,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignora erro caso clipboard não esteja disponível
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-[#163459] bg-[#0F2744] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-base sm:text-lg font-semibold tracking-tight text-white">
            Sistema de Gestão de Colaboradores
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-500/60 bg-transparent px-3 text-xs font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-lg border border-amber-300 bg-white p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-800">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            Acesso não autorizado
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sua conta Google foi autenticada, mas o seu identificador (UID) ainda não consta na lista de usuários autorizados gerenciada pelo administrador no Firestore.
          </p>

          <div className="mt-5 space-y-2.5 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs">
            {email && (
              <div>
                <span className="block font-medium text-slate-500">
                  Conta autenticada
                </span>
                <span className="mt-0.5 block font-medium text-slate-900">
                  {email}
                </span>
              </div>
            )}
            <div>
              <span className="block font-medium text-slate-500">
                UID para cadastro administrativo (coleção authorized_users)
              </span>
              <div className="mt-1 flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2">
                <code className="truncate font-mono text-xs text-slate-800">
                  {uid}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar UID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isRechecking}
              onClick={onRecheck}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRechecking ? 'animate-spin' : ''}`}
              />
              {isRechecking ? 'Verificando...' : 'Verificar novamente'}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              Sair e trocar de conta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
