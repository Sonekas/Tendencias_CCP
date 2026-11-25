import React from 'react';
import { Pencil, UserPlus, Upload, Database, Play, ArrowRight } from 'lucide-react';
import { Employee, Onboarding } from '../types/employee';
import {
  getOnboardingCompletedCount,
  getOnboardingStatus,
  getOnboardingTotalCount,
} from '../utils/onboardingStorage';

interface EmployeeTableProps {
  employees: Employee[];
  onboardingsByEmployeeId: Map<string, Onboarding>;
  totalCount: number;
  hasActiveFilters: boolean;
  onEdit: (employee: Employee) => void;
  onStartOnboarding: (colaboradorId: string) => void;
  onViewOnboarding: (colaboradorId: string) => void;
  onNewEmployee: () => void;
  onOpenImport: () => void;
  onLoadDemo: () => void;
  onClearFilters: () => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onboardingsByEmployeeId,
  totalCount,
  hasActiveFilters,
  onEdit,
  onStartOnboarding,
  onViewOnboarding,
  onNewEmployee,
  onOpenImport,
  onLoadDemo,
  onClearFilters,
}) => {
  if (totalCount === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Nenhum colaborador cadastrado ainda
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Cadastre o primeiro registro manualmente, importe seu arquivo CSV de demonstração ou carregue um conjunto fictício de exemplo.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNewEmployee}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Novo colaborador
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            <Database className="h-4 w-4" />
            Carregar dados de exemplo
          </button>
        </div>
      </div>
    );
  }

  if (employees.length === 0 && hasActiveFilters) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Nenhum colaborador corresponde aos filtros aplicados
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
          Os indicadores da Visão geral continuam refletindo todos os {totalCount} registros cadastrados.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            Limpar busca e filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50/80">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold tracking-wide text-slate-600"
              >
                Nome
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold tracking-wide text-slate-600"
              >
                E-mail profissional
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold tracking-wide text-slate-600"
              >
                Setor
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold tracking-wide text-slate-600"
              >
                Situação
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold tracking-wide text-slate-600"
              >
                Admissão
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-slate-600"
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm">
            {employees.map((employee) => {
              const onboarding = onboardingsByEmployeeId.get(employee.id);
              const onboardingStatus = onboarding
                ? getOnboardingStatus(onboarding)
                : null;
              const completed = onboarding
                ? getOnboardingCompletedCount(onboarding)
                : 0;
              const totalTasks = onboarding
                ? getOnboardingTotalCount(onboarding)
                : 3;

              return (
                <tr
                  key={employee.id}
                  className="hover:bg-slate-50/90 transition-colors"
                >
                  <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                    {employee.nome}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                    {employee.email}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 whitespace-nowrap">
                    {employee.setor}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={
                        employee.situacao === 'Ativo'
                          ? 'font-medium text-emerald-700'
                          : 'font-medium text-slate-500'
                      }
                    >
                      {employee.situacao}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {onboarding && onboardingStatus ? (
                      <span
                        className={
                          onboardingStatus === 'Concluída'
                            ? 'font-medium text-emerald-700'
                            : 'font-medium text-blue-700'
                        }
                      >
                        {onboardingStatus}{' '}
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          ({completed}/{totalTasks})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Não iniciada</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {onboarding ? (
                        <button
                          type="button"
                          onClick={() => onViewOnboarding(employee.id)}
                          aria-label={`Ver admissão de ${employee.nome}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                        >
                          Ver admissão
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStartOnboarding(employee.id)}
                          aria-label={`Iniciar admissão de ${employee.nome}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Play className="h-3 w-3 text-blue-600" />
                          Iniciar admissão
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(employee)}
                        aria-label={`Editar ${employee.nome}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
