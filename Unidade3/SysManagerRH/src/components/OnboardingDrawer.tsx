import React, { useEffect, useRef } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import {
  Employee,
  ONBOARDING_SEGMENT_LABELS,
  Onboarding,
} from '../types/employee';
import {
  formatDisplayDatePtBr,
  getOnboardingCompletedCount,
  getOnboardingStatePresentation,
  getOnboardingTotalCount,
} from '../utils/onboardingStorage';

interface OnboardingDrawerProps {
  isOpen: boolean;
  onboarding: Onboarding | null;
  employee: Employee | null;
  onClose: () => void;
  onToggleTask: (onboardingId: string, taskId: string) => void;
  onUpdateStartDate: (onboardingId: string, dateStr?: string) => void;
}

export const OnboardingDrawer: React.FC<OnboardingDrawerProps> = ({
  isOpen,
  onboarding,
  employee,
  onClose,
  onToggleTask,
  onUpdateStartDate,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !onboarding || !employee) return null;

  const presentation = getOnboardingStatePresentation(onboarding);
  const completed = getOnboardingCompletedCount(onboarding);
  const total = getOnboardingTotalCount(onboarding);
  const isConcluida = presentation.checklistStatusLabel === 'Concluída';
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusTone = isConcluida
    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
    : presentation.visualState === 'inicio-proximo' ||
        presentation.visualState === 'atrasada'
      ? 'text-amber-900 bg-amber-50 border-amber-200'
      : 'text-blue-800 bg-blue-50 border-blue-200';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-drawer-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full flex-col bg-white md:max-w-md md:border-l md:border-slate-200 md:shadow-xl transition-transform duration-150">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2
              id="onboarding-drawer-title"
              className="truncate text-lg font-semibold text-slate-900"
            >
              {employee.nome}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{employee.setor}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{employee.email}</span>
              <span aria-hidden="true">·</span>
              <span>
                Cadastro:{' '}
                <strong
                  className={
                    employee.situacao === 'Ativo'
                      ? 'font-medium text-emerald-700'
                      : 'font-medium text-slate-600'
                  }
                >
                  {employee.situacao}
                </strong>
              </span>
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha de admissão"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className={`rounded-md border px-4 py-3.5 ${statusTone}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-medium opacity-85">
                  Situação da admissão
                </span>
                <span className="mt-0.5 block text-base font-semibold">
                  {presentation.checklistStatusLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-medium opacity-85">
                  Progresso
                </span>
                <span className="mt-0.5 block font-mono text-base font-semibold tabular-nums">
                  {completed}/{total}
                </span>
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-white/80">
              <div
                className={`h-full transition-all duration-150 ${
                  isConcluida
                    ? 'bg-emerald-600'
                    : presentation.visualState === 'inicio-proximo' ||
                        presentation.visualState === 'atrasada'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-medium">
              Cartão na linha do tempo: {presentation.cardBadgeLabel}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="admissao-data-inicio"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
              >
                <Calendar className="h-4 w-4 text-slate-500" />
                Data prevista de início (opcional)
              </label>
              {onboarding.dataPrevistaInicio && (
                <button
                  type="button"
                  onClick={() => onUpdateStartDate(onboarding.id, undefined)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
                >
                  Mover para A agendar
                </button>
              )}
            </div>
            <input
              id="admissao-data-inicio"
              type="date"
              value={onboarding.dataPrevistaInicio ?? ''}
              onChange={(e) =>
                onUpdateStartDate(
                  onboarding.id,
                  e.target.value ? e.target.value : undefined,
                )
              }
              className="mt-2 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {onboarding.dataPrevistaInicio
                ? `Agendada para ${formatDisplayDatePtBr(onboarding.dataPrevistaInicio)}.`
                : 'Sem data definida; o cartão permanece na seção “A agendar”.'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Checklist de integração
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Marque ou reabra as etapas para atualizar o cartão e os indicadores.
            </p>

            <ul
              className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white"
              aria-label={`Etapas de admissão de ${employee.nome}`}
            >
              {onboarding.tarefas.map((task, index) => {
                const segmentName = ONBOARDING_SEGMENT_LABELS[index] ?? '';
                return (
                  <li key={task.id}>
                    <label className="flex min-h-[54px] cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 transition-colors duration-150">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                            task.concluida
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        <input
                          type="checkbox"
                          checked={task.concluida}
                          onChange={() => onToggleTask(onboarding.id, task.id)}
                          className="sr-only"
                        />
                        <div>
                          <span
                            className={`block text-sm transition-colors duration-150 ${
                              task.concluida
                                ? 'text-slate-500 line-through'
                                : 'font-medium text-slate-900'
                            }`}
                          >
                            {task.titulo}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            Segmento: {segmentName}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          task.concluida ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {task.concluida ? 'Concluída' : 'Pendente'}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors duration-150 whitespace-nowrap"
          >
            Fechar ficha
          </button>
        </div>
      </div>
    </div>
  );
};
