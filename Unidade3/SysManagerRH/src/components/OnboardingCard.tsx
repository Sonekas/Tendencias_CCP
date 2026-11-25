import React from 'react';
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

interface OnboardingCardProps {
  onboarding: Onboarding;
  employee: Employee;
  showDateLabel?: boolean;
  isSelected?: boolean;
  onSelect: (onboardingId: string) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  onboarding,
  employee,
  showDateLabel = false,
  isSelected = false,
  onSelect,
  buttonRef,
}) => {
  const presentation = getOnboardingStatePresentation(onboarding);
  const completed = getOnboardingCompletedCount(onboarding);
  const total = getOnboardingTotalCount(onboarding);

  const containerTone = (() => {
    if (presentation.visualState === 'concluida') {
      return 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400';
    }
    if (
      presentation.visualState === 'inicio-proximo' ||
      presentation.visualState === 'atrasada'
    ) {
      return 'border-amber-300 bg-amber-50/55 hover:border-amber-400';
    }
    return 'border-slate-200 bg-white hover:border-blue-300';
  })();

  const statusTextTone = (() => {
    if (presentation.visualState === 'concluida') {
      return 'text-emerald-800 font-semibold';
    }
    if (
      presentation.visualState === 'inicio-proximo' ||
      presentation.visualState === 'atrasada'
    ) {
      return 'text-amber-900 font-semibold';
    }
    if (presentation.visualState === 'a-agendar') {
      return 'text-slate-700 font-medium';
    }
    return 'text-blue-700 font-medium';
  })();

  const isUrgentPending =
    presentation.visualState === 'inicio-proximo' ||
    presentation.visualState === 'atrasada';

  const shortSegmentLabels = ['Doc.', 'Acessos', 'Integr.'] as const;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onSelect(onboarding.id)}
      aria-label={`Abrir checklist de ${employee.nome}, setor ${employee.setor}, ${presentation.cardBadgeLabel}, ${completed} de ${total} etapas concluídas`}
      className={`group w-full rounded-md border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${containerTone} ${
        isSelected ? 'ring-2 ring-blue-600' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-800 transition-colors duration-150">
            {employee.nome}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            <span>{employee.setor}</span>
            {showDateLabel && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {onboarding.dataPrevistaInicio
                    ? formatDisplayDatePtBr(onboarding.dataPrevistaInicio)
                    : 'Sem data'}
                </span>
              </>
            )}
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums shrink-0">
          {completed}/{total}
        </span>
      </div>

      <div
        className="mt-3 grid grid-cols-3 gap-1.5"
        role="group"
        aria-label="Etapas da admissão"
      >
        {ONBOARDING_SEGMENT_LABELS.map((segmentName, index) => {
          const task = onboarding.tarefas[index];
          const done = Boolean(task?.concluida);
          const stateText = done ? 'Concluída' : 'Pendente';

          const barTone = done
            ? 'bg-emerald-600'
            : isUrgentPending
              ? 'bg-amber-300'
              : 'bg-slate-200';

          const labelTone = done
            ? 'text-emerald-800 font-medium'
            : isUrgentPending
              ? 'text-amber-900'
              : 'text-slate-500';

          return (
            <div
              key={segmentName}
              title={`${segmentName}: ${stateText}`}
              aria-label={`${segmentName}: ${stateText}`}
              className="min-w-0"
            >
              <div className={`h-1.5 w-full rounded-xs transition-colors duration-150 ${barTone}`} />
              <span
                aria-hidden="true"
                className={`mt-1 block truncate text-[11px] leading-tight ${labelTone}`}
              >
                {shortSegmentLabels[index]}
              </span>
              <span className="sr-only">
                {segmentName}: {stateText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2">
        <span className={`text-xs leading-snug ${statusTextTone}`}>
          {presentation.cardBadgeLabel}
        </span>
      </div>
    </button>
  );
};
