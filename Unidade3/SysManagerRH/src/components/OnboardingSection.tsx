import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Play,
} from 'lucide-react';
import { AppTab, Employee, Onboarding, SETORES, Setor } from '../types/employee';
import {
  addLocalDays,
  formatDisplayDatePtBr,
  formatLocalDateKey,
  getOnboardingStatePresentation,
  getOnboardingStatus,
} from '../utils/onboardingStorage';
import { OnboardingCard } from './OnboardingCard';
import { OnboardingDrawer } from './OnboardingDrawer';

interface OnboardingSectionProps {
  employees: Employee[];
  onboardings: Onboarding[];
  selectedOnboardingId: string | null;
  onSelectOnboarding: (onboardingId: string | null) => void;
  onToggleTask: (onboardingId: string, taskId: string) => void;
  onUpdateStartDate: (onboardingId: string, dateStr?: string) => void;
  onStartOnboarding: (colaboradorId: string, dataPrevistaInicio?: string) => void;
  onNavigate: (tab: AppTab) => void;
}

type ViewMode = 'timeline' | 'lista';
type ListFilter =
  | 'todas'
  | 'em-andamento'
  | 'inicio-proximo'
  | 'atrasadas'
  | 'a-agendar'
  | 'concluidas';

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const OnboardingSection: React.FC<OnboardingSectionProps> = ({
  employees,
  onboardings,
  selectedOnboardingId,
  onSelectOnboarding,
  onToggleTask,
  onUpdateStartDate,
  onStartOnboarding,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [listFilter, setListFilter] = useState<ListFilter>('todas');
  const [setorFilter, setSetorFilter] = useState<'Todos' | Setor>('Todos');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [quickStartDate, setQuickStartDate] = useState<string>('');

  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastTriggerIdRef = useRef<string | null>(null);

  const setCardRef = (onboardingId: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      cardRefs.current.set(onboardingId, el);
    } else {
      cardRefs.current.delete(onboardingId);
    }
  };

  const employeesById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const emp of employees) {
      map.set(emp.id, emp);
    }
    return map;
  }, [employees]);

  const onboardedIds = useMemo(
    () => new Set(onboardings.map((item) => item.colaboradorId)),
    [onboardings],
  );

  const eligibleEmployees = useMemo(
    () => employees.filter((emp) => !onboardedIds.has(emp.id)),
    [employees, onboardedIds],
  );

  const today = useMemo(() => new Date(), []);

  const sevenDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = addLocalDays(today, offset);
      const dateKey = formatLocalDateKey(date);
      const weekday = WEEKDAY_SHORT[date.getDay()];
      const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;
      const label =
        offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : `${weekday}`;

      return {
        offset,
        dateKey,
        label,
        dayMonth,
        isCriticalWindow: offset <= 2,
      };
    });
  }, [today]);

  const validOnboardings = useMemo(
    () => onboardings.filter((item) => employeesById.has(item.colaboradorId)),
    [onboardings, employeesById],
  );

  const metrics = useMemo(() => {
    let emAndamento = 0;
    let inicioProximo = 0;
    let atrasadas = 0;
    let aAgendar = 0;
    let prontas = 0;

    for (const item of validOnboardings) {
      const presentation = getOnboardingStatePresentation(item, today);
      if (presentation.visualState === 'concluida') {
        prontas += 1;
      } else {
        emAndamento += 1;
        if (presentation.visualState === 'inicio-proximo') {
          inicioProximo += 1;
        } else if (presentation.visualState === 'atrasada') {
          atrasadas += 1;
        }
      }
      if (!item.dataPrevistaInicio) {
        aAgendar += 1;
      }
    }

    return {
      total: validOnboardings.length,
      emAndamento,
      inicioProximo,
      atrasadas,
      aAgendar,
      prontas,
    };
  }, [validOnboardings, today]);

  const onboardingsByDateKey = useMemo(() => {
    const map = new Map<string, Onboarding[]>();
    for (const day of sevenDays) {
      map.set(day.dateKey, []);
    }
    for (const item of validOnboardings) {
      if (!item.dataPrevistaInicio) continue;
      const bucket = map.get(item.dataPrevistaInicio);
      if (bucket) {
        bucket.push(item);
      }
    }
    return map;
  }, [validOnboardings, sevenDays]);

  const unscheduledOnboardings = useMemo(
    () => validOnboardings.filter((item) => !item.dataPrevistaInicio),
    [validOnboardings],
  );

  const outsideWindowCount = useMemo(() => {
    const windowKeys = new Set(sevenDays.map((d) => d.dateKey));
    return validOnboardings.filter(
      (item) =>
        Boolean(item.dataPrevistaInicio) &&
        !windowKeys.has(item.dataPrevistaInicio as string),
    ).length;
  }, [validOnboardings, sevenDays]);

  const filteredListOnboardings = useMemo(() => {
    return validOnboardings
      .filter((item) => {
        const emp = employeesById.get(item.colaboradorId);
        if (!emp) return false;
        if (setorFilter !== 'Todos' && emp.setor !== setorFilter) {
          return false;
        }

        const presentation = getOnboardingStatePresentation(item, today);
        const status = getOnboardingStatus(item);

        if (listFilter === 'em-andamento') return status === 'Em andamento';
        if (listFilter === 'concluidas') return status === 'Concluída';
        if (listFilter === 'inicio-proximo')
          return presentation.visualState === 'inicio-proximo';
        if (listFilter === 'atrasadas')
          return presentation.visualState === 'atrasada';
        if (listFilter === 'a-agendar') return !item.dataPrevistaInicio;
        return true;
      })
      .sort((a, b) => {
        if (a.dataPrevistaInicio && b.dataPrevistaInicio) {
          return a.dataPrevistaInicio.localeCompare(b.dataPrevistaInicio);
        }
        if (a.dataPrevistaInicio && !b.dataPrevistaInicio) return -1;
        if (!a.dataPrevistaInicio && b.dataPrevistaInicio) return 1;
        return a.criadaEm.localeCompare(b.criadaEm);
      });
  }, [validOnboardings, employeesById, setorFilter, listFilter, today]);

  const handleOpenCard = (onboardingId: string) => {
    lastTriggerIdRef.current = onboardingId;
    onSelectOnboarding(onboardingId);
  };

  const handleCloseDrawer = () => {
    const restoreId = lastTriggerIdRef.current ?? selectedOnboardingId;
    onSelectOnboarding(null);
    if (restoreId) {
      window.requestAnimationFrame(() => {
        const target = cardRefs.current.get(restoreId);
        target?.focus({ preventScroll: true });
      });
    }
  };

  const handleOpenOverdueList = () => {
    setViewMode('lista');
    setListFilter('atrasadas');
  };

  const handleQuickStart = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmployeeId) return;
    onStartOnboarding(
      selectedEmployeeId,
      quickStartDate ? quickStartDate : undefined,
    );
    setSelectedEmployeeId('');
    setQuickStartDate('');
  };

  const selectedOnboarding = selectedOnboardingId
    ? validOnboardings.find((item) => item.id === selectedOnboardingId) ?? null
    : null;
  const selectedEmployee = selectedOnboarding
    ? employeesById.get(selectedOnboarding.colaboradorId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores da linha do tempo de admissões"
        className="rounded-lg border border-slate-200 bg-white"
      >
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 lg:grid-cols-4 lg:divide-y-0">
          <div className="flex flex-col justify-between gap-1.5 px-4 py-4 sm:px-5">
            <span className="text-xs font-medium text-slate-600">
              Em andamento
            </span>
            <p className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {metrics.emAndamento}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-1.5 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Início próximo (0–2d)
              </span>
              {metrics.inicioProximo > 0 && (
                <span className="text-[11px] font-semibold text-amber-800 whitespace-nowrap">
                  Atenção
                </span>
              )}
            </div>
            <p className="font-mono text-2xl font-semibold tracking-tight text-amber-800 tabular-nums">
              {metrics.inicioProximo}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-1.5 px-5 py-4">
            <span className="text-xs font-medium text-slate-600">
              A agendar (sem data)
            </span>
            <p className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {metrics.aAgendar}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-1.5 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Prontas para começar
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                3/3
              </span>
            </div>
            <p className="font-mono text-2xl font-semibold tracking-tight text-emerald-700 tabular-nums">
              {metrics.prontas}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1"
            role="group"
            aria-label="Modo de visualização de admissões"
          >
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`h-8 rounded px-3 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Linha do tempo (7 dias)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`h-8 rounded px-3 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'lista'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista completa ({validOnboardings.length})
            </button>
          </div>

          {metrics.atrasadas > 0 && (
            <button
              type="button"
              onClick={handleOpenOverdueList}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              <span className="font-mono tabular-nums">
                Ver atrasos ({metrics.atrasadas})
              </span>
            </button>
          )}

          {viewMode === 'timeline' && outsideWindowCount > 0 && metrics.atrasadas === 0 && (
            <button
              type="button"
              onClick={() => {
                setViewMode('lista');
                setListFilter('todas');
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {outsideWindowCount} fora dos próximos 7 dias
              </span>
            </button>
          )}
        </div>

        {eligibleEmployees.length > 0 && (
          <form
            onSubmit={handleQuickStart}
            className="flex flex-wrap items-center gap-2"
          >
            <label htmlFor="selecionar-colaborador-admissao" className="sr-only">
              Selecionar colaborador sem admissão
            </label>
            <select
              id="selecionar-colaborador-admissao"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="h-10 min-w-0 w-full sm:w-auto sm:min-w-[200px] rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">Iniciar para colaborador...</option>
              {eligibleEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome} ({emp.setor})
                </option>
              ))}
            </select>

            <label htmlFor="data-inicio-rapida" className="sr-only">
              Data prevista de início opcional
            </label>
            <input
              id="data-inicio-rapida"
              type="date"
              value={quickStartDate}
              onChange={(e) => setQuickStartDate(e.target.value)}
              title="Data prevista de início (opcional)"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />

            <button
              type="submit"
              disabled={!selectedEmployeeId}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              Iniciar admissão
            </button>
          </form>
        )}
      </div>

      {validOnboardings.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-9 w-9 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            Nenhuma admissão iniciada ainda
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Cadastre um novo colaborador marcando “Iniciar admissão” ou vá até Colaboradores para iniciar o processo de quem já está cadastrado.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('colaboradores')}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              Ir para Colaboradores
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-6">
          <section aria-label="Linha do tempo dos próximos sete dias">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Próximos 7 dias
                </h3>
                <p className="text-xs text-slate-500">
                  Pendências de hoje até +2 dias recebem destaque âmbar. Clique em um cartão para abrir o checklist.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {formatDisplayDatePtBr(sevenDays[0].dateKey)} a{' '}
                {formatDisplayDatePtBr(sevenDays[6].dateKey)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-flow-col md:auto-cols-[minmax(215px,1fr)] md:overflow-x-auto md:pb-2 xl:grid-flow-row xl:grid-cols-7 xl:overflow-x-visible xl:pb-0">
              {sevenDays.map((day) => {
                const items = onboardingsByDateKey.get(day.dateKey) ?? [];

                return (
                  <section
                    key={day.dateKey}
                    aria-label={`${day.label}, ${day.dayMonth}`}
                    className="flex flex-col rounded-lg border border-slate-200 bg-white"
                  >
                    <header
                      className={`flex items-center justify-between border-b px-3.5 py-2.5 ${
                        day.offset === 0
                          ? 'border-blue-200 bg-blue-50/60'
                          : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-xs font-semibold ${
                            day.offset === 0 ? 'text-blue-800' : 'text-slate-900'
                          }`}
                        >
                          {day.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {day.dayMonth}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                        {items.length}
                      </span>
                    </header>

                    <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                      {items.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">
                          Sem admissões
                        </p>
                      ) : (
                        items.map((onboarding) => {
                          const employee = employeesById.get(
                            onboarding.colaboradorId,
                          );
                          if (!employee) return null;

                          return (
                            <OnboardingCard
                              key={onboarding.id}
                              onboarding={onboarding}
                              employee={employee}
                              isSelected={selectedOnboardingId === onboarding.id}
                              onSelect={handleOpenCard}
                              buttonRef={setCardRef(onboarding.id)}
                            />
                          );
                        })
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section
            aria-label="Admissões a agendar sem data prevista"
            className="rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  A agendar
                </h3>
                <p className="text-xs text-slate-500">
                  Admissões sem data prevista de início definida. Abra um cartão para informar a data.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                {unscheduledOnboardings.length}
              </span>
            </div>

            {unscheduledOnboardings.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Todas as admissões já possuem data prevista de início.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unscheduledOnboardings.map((onboarding) => {
                  const employee = employeesById.get(onboarding.colaboradorId);
                  if (!employee) return null;

                  return (
                    <OnboardingCard
                      key={onboarding.id}
                      onboarding={onboarding}
                      employee={employee}
                      isSelected={selectedOnboardingId === onboarding.id}
                      onSelect={handleOpenCard}
                      buttonRef={setCardRef(onboarding.id)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section
          aria-label="Lista completa de admissões"
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1"
              role="group"
              aria-label="Filtrar lista completa de admissões"
            >
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'em-andamento', label: 'Em andamento' },
                  { id: 'inicio-proximo', label: 'Início próximo' },
                  { id: 'atrasadas', label: `Atrasadas (${metrics.atrasadas})` },
                  { id: 'a-agendar', label: 'A agendar' },
                  { id: 'concluidas', label: 'Concluídas' },
                ] as const
              ).map((tab) => {
                const active = listFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setListFilter(tab.id)}
                    className={`h-8 rounded px-3 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="lista-filtro-setor"
                className="text-xs font-medium text-slate-600 whitespace-nowrap"
              >
                Setor
              </label>
              <select
                id="lista-filtro-setor"
                value={setorFilter}
                onChange={(e) =>
                  setSetorFilter(e.target.value as 'Todos' | Setor)
                }
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="Todos">Todos os setores</option>
                {SETORES.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredListOnboardings.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                Nenhuma admissão corresponde aos filtros selecionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setListFilter('todas');
                  setSetorFilter('Todos');
                }}
                className="mt-4 inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Exibir todas as admissões
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListOnboardings.map((onboarding) => {
                const employee = employeesById.get(onboarding.colaboradorId);
                if (!employee) return null;

                return (
                  <OnboardingCard
                    key={onboarding.id}
                    onboarding={onboarding}
                    employee={employee}
                    showDateLabel
                    isSelected={selectedOnboardingId === onboarding.id}
                    onSelect={handleOpenCard}
                    buttonRef={setCardRef(onboarding.id)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      <OnboardingDrawer
        isOpen={Boolean(selectedOnboarding && selectedEmployee)}
        onboarding={selectedOnboarding}
        employee={selectedEmployee}
        onClose={handleCloseDrawer}
        onToggleTask={onToggleTask}
        onUpdateStartDate={onUpdateStartDate}
      />
    </div>
  );
};
