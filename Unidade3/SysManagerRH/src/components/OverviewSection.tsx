import React, { useMemo } from 'react';
import { ArrowRight, UserPlus, Upload, Database } from 'lucide-react';
import { AppTab, Employee, Onboarding, SETORES, Setor } from '../types/employee';
import { getOnboardingStatus } from '../utils/onboardingStorage';

interface OverviewSectionProps {
  employees: Employee[];
  onboardings: Onboarding[];
  onNavigate: (tab: AppTab) => void;
  onNewEmployee: () => void;
  onOpenImport: () => void;
  onLoadDemo: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  employees,
  onboardings,
  onNavigate,
  onNewEmployee,
  onOpenImport,
  onLoadDemo,
}) => {
  const summary = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter((emp) => emp.situacao === 'Ativo').length;
    const inativos = employees.filter((emp) => emp.situacao === 'Inativo').length;

    const admissoesEmAndamento = onboardings.filter(
      (item) => getOnboardingStatus(item) === 'Em andamento',
    ).length;
    const admissoesConcluidas = onboardings.filter(
      (item) => getOnboardingStatus(item) === 'Concluída',
    ).length;

    const porSetor: Record<
      Setor,
      { total: number; ativos: number; inativos: number }
    > = {
      RH: { total: 0, ativos: 0, inativos: 0 },
      TI: { total: 0, ativos: 0, inativos: 0 },
      Financeiro: { total: 0, ativos: 0, inativos: 0 },
      Operações: { total: 0, ativos: 0, inativos: 0 },
    };

    for (const emp of employees) {
      const bucket = porSetor[emp.setor];
      if (!bucket) continue;
      bucket.total += 1;
      if (emp.situacao === 'Ativo') {
        bucket.ativos += 1;
      } else {
        bucket.inativos += 1;
      }
    }

    return {
      total,
      ativos,
      inativos,
      admissoesEmAndamento,
      admissoesConcluidas,
      totalAdmissoes: onboardings.length,
      porSetor,
    };
  }, [employees, onboardings]);

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores principais da base completa"
        className="rounded-lg border border-slate-200 bg-white"
      >
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          <div className="flex flex-col justify-between gap-2 px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-600">
                Total de colaboradores
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                Base completa
              </span>
            </div>
            <p className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {summary.total}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-2 px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-600">
                Colaboradores ativos
              </span>
              <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">
                Ativo
              </span>
            </div>
            <p className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {summary.ativos}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-2 px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-600">
                Colaboradores inativos
              </span>
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                Inativo
              </span>
            </div>
            <p className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {summary.inativos}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-2 px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-600">
                Admissões em andamento
              </span>
              <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
                Em andamento
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {summary.admissoesEmAndamento}
              </p>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {summary.admissoesConcluidas} concluída(s)
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-label="Quantidade de colaboradores por setor"
          className="rounded-lg border border-slate-200 bg-white lg:col-span-2"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Colaboradores por setor
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Distribuição completa entre RH, TI, Financeiro e Operações
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('colaboradores')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline whitespace-nowrap shrink-0"
            >
              Ver diretório
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {SETORES.map((setor) => {
              const bucket = summary.porSetor[setor];
              const pct =
                summary.total > 0
                  ? Math.round((bucket.total / summary.total) * 100)
                  : 0;

              return (
                <div key={setor} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {setor}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {bucket.ativos} ativo(s) · {bucket.inativos} inativo(s)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {bucket.total}
                      </span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-sm bg-slate-100">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          aria-label="Resumo de admissões e ações rápidas"
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white"
        >
          <div>
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Fluxo de admissões
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Simulação de checklist com 3 etapas por colaborador
              </p>
            </div>

            <div className="divide-y divide-slate-200 px-6">
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-slate-600">Em andamento</span>
                <span className="font-mono text-lg font-semibold text-blue-700 tabular-nums">
                  {summary.admissoesEmAndamento}
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-slate-600">Concluídas (3/3)</span>
                <span className="font-mono text-lg font-semibold text-emerald-700 tabular-nums">
                  {summary.admissoesConcluidas}
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-slate-600">Total de processos</span>
                <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {summary.totalAdmissoes}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-200 bg-slate-50/70 px-6 py-5">
            <button
              type="button"
              onClick={() => onNavigate('admissoes')}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
            >
              <span>Acompanhar admissões</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              onClick={onNewEmployee}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Novo colaborador
            </button>
            {summary.total === 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenImport}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Importar CSV
                </button>
                <button
                  type="button"
                  onClick={onLoadDemo}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
                >
                  <Database className="h-3.5 w-3.5" />
                  Exemplo fictício
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
