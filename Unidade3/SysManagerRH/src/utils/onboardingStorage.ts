import {
  ONBOARDING_DEFAULT_TASKS,
  Onboarding,
  OnboardingStatus,
  OnboardingTask,
} from '../types/employee';

export const ONBOARDING_STORAGE_KEY = 'sgc_admissoes_v1';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function createOnboardingId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `adm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isValidLocalDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addLocalDays(referenceDate: Date, offsetDays: number): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + offsetDays,
  );
}

export function diffCalendarDays(
  targetDateStr: string,
  referenceDate: Date = new Date(),
): number {
  const target = parseLocalDateKey(targetDateStr);
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const diffMs = target.getTime() - refMidnight.getTime();
  return Math.round(diffMs / 86_400_000);
}

export function formatDisplayDatePtBr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export type OnboardingVisualState =
  | 'concluida'
  | 'atrasada'
  | 'inicio-proximo'
  | 'em-andamento'
  | 'a-agendar';

export interface OnboardingStatePresentation {
  visualState: OnboardingVisualState;
  cardBadgeLabel: string;
  checklistStatusLabel: OnboardingStatus;
  diffDays: number | null;
}

export function getOnboardingStatePresentation(
  onboarding: Pick<Onboarding, 'tarefas' | 'dataPrevistaInicio'>,
  referenceDate: Date = new Date(),
): OnboardingStatePresentation {
  const status = getOnboardingStatus(onboarding);
  const diffDays =
    onboarding.dataPrevistaInicio &&
    isValidLocalDateString(onboarding.dataPrevistaInicio)
      ? diffCalendarDays(onboarding.dataPrevistaInicio, referenceDate)
      : null;

  if (status === 'Concluída') {
    return {
      visualState: 'concluida',
      cardBadgeLabel: 'Pronta para começar',
      checklistStatusLabel: 'Concluída',
      diffDays,
    };
  }

  if (diffDays === null) {
    return {
      visualState: 'a-agendar',
      cardBadgeLabel: 'A agendar',
      checklistStatusLabel: 'Em andamento',
      diffDays: null,
    };
  }

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      visualState: 'atrasada',
      cardBadgeLabel:
        absDays === 1 ? 'Atrasada · 1 dia' : `Atrasada · ${absDays} dias`,
      checklistStatusLabel: 'Em andamento',
      diffDays,
    };
  }

  if (diffDays <= 2) {
    const label =
      diffDays === 0
        ? 'Início próximo · Hoje'
        : diffDays === 1
          ? 'Início próximo · Amanhã'
          : 'Início próximo · Em 2 dias';
    return {
      visualState: 'inicio-proximo',
      cardBadgeLabel: label,
      checklistStatusLabel: 'Em andamento',
      diffDays,
    };
  }

  return {
    visualState: 'em-andamento',
    cardBadgeLabel: 'Em andamento',
    checklistStatusLabel: 'Em andamento',
    diffDays,
  };
}

export function createDefaultOnboardingTasks(): OnboardingTask[] {
  return ONBOARDING_DEFAULT_TASKS.map((titulo, index) => ({
    id: `tarefa_${index + 1}`,
    titulo,
    concluida: false,
  }));
}

export function getOnboardingCompletedCount(
  onboarding: Pick<Onboarding, 'tarefas'>,
): number {
  return onboarding.tarefas.filter((task) => task.concluida).length;
}

export function getOnboardingTotalCount(
  onboarding: Pick<Onboarding, 'tarefas'>,
): number {
  return onboarding.tarefas.length;
}

export function getOnboardingStatus(
  onboarding: Pick<Onboarding, 'tarefas'>,
): OnboardingStatus {
  const total = getOnboardingTotalCount(onboarding);
  const completed = getOnboardingCompletedCount(onboarding);
  return total > 0 && completed === total ? 'Concluída' : 'Em andamento';
}

export function createOnboardingRecord(
  colaboradorId: string,
  existingOnboardings: Onboarding[],
  dataPrevistaInicio?: string,
): Onboarding | null {
  const alreadyExists = existingOnboardings.some(
    (item) => item.colaboradorId === colaboradorId,
  );
  if (alreadyExists) {
    return null;
  }

  const now = new Date().toISOString();
  const validDate = isValidLocalDateString(dataPrevistaInicio)
    ? dataPrevistaInicio
    : undefined;

  return {
    id: createOnboardingId(),
    colaboradorId,
    tarefas: createDefaultOnboardingTasks(),
    ...(validDate ? { dataPrevistaInicio: validDate } : {}),
    criadaEm: now,
    atualizadaEm: now,
  };
}

export function toggleOnboardingTask(
  onboarding: Onboarding,
  taskId: string,
): Onboarding {
  const now = new Date().toISOString();
  return {
    ...onboarding,
    tarefas: onboarding.tarefas.map((task) =>
      task.id === taskId ? { ...task, concluida: !task.concluida } : task,
    ),
    atualizadaEm: now,
  };
}

export function updateOnboardingStartDate(
  onboarding: Onboarding,
  dataPrevistaInicio?: string,
): Onboarding {
  const now = new Date().toISOString();
  const validDate = isValidLocalDateString(dataPrevistaInicio)
    ? dataPrevistaInicio
    : undefined;

  if (!validDate) {
    const { dataPrevistaInicio: _removed, ...rest } = onboarding;
    return {
      ...rest,
      atualizadaEm: now,
    };
  }

  return {
    ...onboarding,
    dataPrevistaInicio: validDate,
    atualizadaEm: now,
  };
}

export function loadOnboardings(validEmployeeIds?: Set<string>): Onboarding[] {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenCollaborators = new Set<string>();
    const result: Onboarding[] = [];

    for (const item of parsed) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.id !== 'string' ||
        typeof item.colaboradorId !== 'string' ||
        !Array.isArray(item.tarefas)
      ) {
        continue;
      }

      if (validEmployeeIds && !validEmployeeIds.has(item.colaboradorId)) {
        continue;
      }

      if (seenCollaborators.has(item.colaboradorId)) {
        continue;
      }

      const validTasks = item.tarefas.filter(
        (t: unknown): t is OnboardingTask =>
          Boolean(t) &&
          typeof t === 'object' &&
          typeof (t as OnboardingTask).id === 'string' &&
          typeof (t as OnboardingTask).titulo === 'string' &&
          typeof (t as OnboardingTask).concluida === 'boolean',
      );

      if (validTasks.length !== ONBOARDING_DEFAULT_TASKS.length) {
        continue;
      }

      const validDate = isValidLocalDateString(item.dataPrevistaInicio)
        ? item.dataPrevistaInicio
        : undefined;

      seenCollaborators.add(item.colaboradorId);
      result.push({
        id: item.id,
        colaboradorId: item.colaboradorId,
        tarefas: validTasks,
        ...(validDate ? { dataPrevistaInicio: validDate } : {}),
        criadaEm:
          typeof item.criadaEm === 'string'
            ? item.criadaEm
            : new Date().toISOString(),
        atualizadaEm:
          typeof item.atualizadaEm === 'string'
            ? item.atualizadaEm
            : new Date().toISOString(),
      });
    }

    return result;
  } catch {
    return [];
  }
}

export function saveOnboardings(onboardings: Onboarding[]): void {
  try {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(onboardings),
    );
  } catch {
    // Ignora falha silenciosa de armazenamento
  }
}

export function clearStoredOnboardings(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Ignora erro de remoção
  }
}
