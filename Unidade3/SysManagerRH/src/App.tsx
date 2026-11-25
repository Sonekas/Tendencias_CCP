import React, { useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Search,
  Upload,
  UserPlus,
  X,
  CheckCircle2,
  Trash2,
  LogOut,
  Database,
  AlertCircle,
} from 'lucide-react';
import {
  AppTab,
  Employee,
  Onboarding,
  SETORES,
  Setor,
  Situacao,
} from './types/employee';
import {
  DEMO_EMPLOYEES_SEED,
  clearStoredEmployees,
  createEmployeeId,
  loadEmployees as loadLocalEmployees,
  normalizeEmail,
  normalizeSearchText,
} from './utils/employeeStorage';
import {
  clearStoredOnboardings,
  createOnboardingRecord,
  getOnboardingStatus,
  loadOnboardings as loadLocalOnboardings,
  toggleOnboardingTask,
  updateOnboardingStartDate,
} from './utils/onboardingStorage';
import { ParsedCsvRow } from './utils/csvParser';
import { auth, googleProvider } from './firebase';
import {
  checkUserAuthorization,
  clearAllFirestoreData,
  createEmployeeInFirestore,
  createOnboardingInFirestore,
  importEmployeesBatchToFirestore,
  migrateLocalDataToFirestore,
  subscribeEmployees,
  subscribeOnboardings,
  updateEmployeeInFirestore,
  updateOnboardingStartDateInFirestore,
  updateOnboardingTasksInFirestore,
} from './utils/firestoreService';
import {
  CheckingAuthScreen,
  LoginScreen,
  UnauthorizedScreen,
} from './components/AuthScreens';
import { OverviewSection } from './components/OverviewSection';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeeDrawer } from './components/EmployeeDrawer';
import { CsvImportModal } from './components/CsvImportModal';
import { OnboardingSection } from './components/OnboardingSection';

type SetorFilter = 'Todos' | Setor;
type SituacaoFilter = 'Todas' | Situacao;
type AuthGateState =
  | 'loading'
  | 'visitor'
  | 'checking-permission'
  | 'unauthorized'
  | 'authorized';

const NAV_TABS: { id: AppTab; label: string }[] = [
  { id: 'admissoes', label: 'Admissões' },
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'colaboradores', label: 'Colaboradores' },
];

export default function App() {
  const [authState, setAuthState] = useState<AuthGateState>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRecheckingAuth, setIsRecheckingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('admissoes');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [firestoreErrorMessage, setFirestoreErrorMessage] = useState<
    string | null
  >(null);

  const [localMigrationPending, setLocalMigrationPending] = useState<{
    employees: Employee[];
    onboardings: Onboarding[];
  } | null>(null);
  const [migrationDismissed, setMigrationDismissed] = useState(false);
  const [isMigratingLocal, setIsMigratingLocal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [setorFilter, setSetorFilter] = useState<SetorFilter>('Todos');
  const [situacaoFilter, setSituacaoFilter] = useState<SituacaoFilter>('Todas');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [confirmClearBase, setConfirmClearBase] = useState(false);
  const [selectedOnboardingId, setSelectedOnboardingId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const resetDisplayedData = () => {
    setEmployees([]);
    setOnboardings([]);
    setSearchQuery('');
    setSetorFilter('Todos');
    setSituacaoFilter('Todas');
    setIsDrawerOpen(false);
    setEditingEmployee(null);
    setIsCsvModalOpen(false);
    setConfirmClearBase(false);
    setSelectedOnboardingId(null);
    setFirestoreErrorMessage(null);
    setLocalMigrationPending(null);
    setMigrationDismissed(false);
    setActiveTab('admissoes');
  };

  const verifyUserPermission = async (user: User) => {
    setAuthState('checking-permission');
    setAuthError(null);

    if (!user.emailVerified) {
      resetDisplayedData();
      setAuthError(
        'Sua conta Google não possui e-mail verificado. As regras do Firestore exigem e-mail verificado para liberar o acesso.',
      );
      setAuthState('unauthorized');
      return;
    }

    try {
      const authorized = await checkUserAuthorization(user.uid);
      if (authorized) {
        setAuthState('authorized');
      } else {
        resetDisplayedData();
        setAuthState('unauthorized');
      }
    } catch {
      resetDisplayedData();
      setAuthError(
        'Não foi possível confirmar sua permissão no Firestore agora. Verifique sua conexão e tente novamente.',
      );
      setAuthState('unauthorized');
    }
  };

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setCurrentUser(null);
        resetDisplayedData();
        setAuthError(null);
        setAuthState('visitor');
        return;
      }

      setCurrentUser(user);
      await verifyUserPermission(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState !== 'authorized' || !currentUser) {
      return;
    }

    setIsSyncingData(true);
    setFirestoreErrorMessage(null);

    let employeesLoaded = false;
    let onboardingsLoaded = false;

    const markReadyIfBothLoaded = () => {
      if (employeesLoaded && onboardingsLoaded) {
        setIsSyncingData(false);
      }
    };

    const unsubEmployees = subscribeEmployees(
      (items) => {
        setEmployees(items);
        employeesLoaded = true;
        markReadyIfBothLoaded();
      },
      () => {
        setIsSyncingData(false);
        setFirestoreErrorMessage(
          'Permissão insuficiente ou falha ao ler colaboradores no Firestore.',
        );
      },
    );

    const unsubOnboardings = subscribeOnboardings(
      (items) => {
        setOnboardings(items);
        onboardingsLoaded = true;
        markReadyIfBothLoaded();
      },
      () => {
        setIsSyncingData(false);
        setFirestoreErrorMessage(
          'Permissão insuficiente ou falha ao ler admissões no Firestore.',
        );
      },
    );

    // Detecta dados locais da v3.1 sem apagá-los nem sobrescrevê-los
    const localEmployees = loadLocalEmployees();
    const localIds = new Set(localEmployees.map((e) => e.id));
    const localOnboardings = loadLocalOnboardings(localIds);
    if (localEmployees.length > 0 || localOnboardings.length > 0) {
      setLocalMigrationPending({
        employees: localEmployees,
        onboardings: localOnboardings,
      });
    }

    return () => {
      unsubEmployees();
      unsubOnboardings();
    };
  }, [authState, currentUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('O login foi cancelado antes da conclusão.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'O navegador bloqueou a janela de login. Permita pop-ups para continuar.',
        );
      } else {
        setAuthError('Não foi possível autenticar com o Google. Tente novamente.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRecheckAuthorization = async () => {
    if (!currentUser) return;
    setIsRecheckingAuth(true);
    await verifyUserPermission(currentUser);
    setIsRecheckingAuth(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } finally {
      resetDisplayedData();
      setCurrentUser(null);
      setToast(null);
      setAuthState('visitor');
    }
  };

  const onboardingsByEmployeeId = useMemo(() => {
    const map = new Map<string, Onboarding>();
    for (const item of onboardings) {
      map.set(item.colaboradorId, item);
    }
    return map;
  }, [onboardings]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    setorFilter !== 'Todos' ||
    situacaoFilter !== 'Todas';

  const filteredEmployees = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    return employees.filter((emp) => {
      if (query && !normalizeSearchText(emp.nome).includes(query)) {
        return false;
      }
      if (setorFilter !== 'Todos' && emp.setor !== setorFilter) {
        return false;
      }
      if (situacaoFilter !== 'Todas' && emp.situacao !== situacaoFilter) {
        return false;
      }
      return true;
    });
  }, [employees, searchQuery, setorFilter, situacaoFilter]);

  const handleOpenNewDrawer = () => {
    setEditingEmployee(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingEmployee(null);
  };

  const handleStartOnboardingForEmployee = async (
    colaboradorId: string,
    dataPrevistaInicio?: string,
    employeeName?: string,
  ): Promise<boolean> => {
    const target = employees.find((emp) => emp.id === colaboradorId);
    if (!target && !employeeName) return false;

    const newRecord = createOnboardingRecord(
      colaboradorId,
      onboardings,
      dataPrevistaInicio,
    );
    if (!newRecord) {
      showToast('Este colaborador já possui uma admissão vinculada.', 'error');
      return false;
    }

    try {
      await createOnboardingInFirestore({
        ...newRecord,
        id: colaboradorId,
      });
      showToast(
        `Admissão iniciada para ${employeeName ?? target?.nome ?? 'colaborador'}.`,
      );
      return true;
    } catch {
      showToast('Não foi possível iniciar a admissão no Firestore.', 'error');
      return false;
    }
  };

  const handleViewOnboarding = (colaboradorId: string) => {
    const existing = onboardingsByEmployeeId.get(colaboradorId);
    setIsDrawerOpen(false);
    setEditingEmployee(null);
    setActiveTab('admissoes');
    if (existing) {
      setSelectedOnboardingId(existing.id);
    }
  };

  const handleSaveEmployee = async (values: {
    nome: string;
    email: string;
    setor: Setor;
    situacao: Situacao;
    iniciarAdmissao: boolean;
    dataPrevistaInicio?: string;
  }) => {
    const now = new Date().toISOString();

    try {
      if (editingEmployee) {
        await updateEmployeeInFirestore(editingEmployee.id, {
          nome: values.nome,
          email: values.email,
          setor: values.setor,
          situacao: values.situacao,
          atualizadoEm: now,
        });

        let startedOnboarding = false;
        if (values.iniciarAdmissao) {
          const newRecord = createOnboardingRecord(
            editingEmployee.id,
            onboardings,
            values.dataPrevistaInicio,
          );
          if (newRecord) {
            await createOnboardingInFirestore({
              ...newRecord,
              id: editingEmployee.id,
            });
            startedOnboarding = true;
          }
        }

        showToast(
          startedOnboarding
            ? `Cadastro de ${values.nome} atualizado e admissão iniciada.`
            : `Cadastro de ${values.nome} atualizado.`,
        );
      } else {
        const newId = createEmployeeId();
        const newEmployee: Employee = {
          id: newId,
          nome: values.nome,
          email: values.email,
          setor: values.setor,
          situacao: values.situacao,
          atualizadoEm: now,
        };

        const optionalOnboarding = values.iniciarAdmissao
          ? createOnboardingRecord(newId, onboardings, values.dataPrevistaInicio)
          : null;

        await createEmployeeInFirestore(
          newEmployee,
          optionalOnboarding ? { ...optionalOnboarding, id: newId } : null,
        );

        showToast(
          values.iniciarAdmissao
            ? `${values.nome} cadastrado e admissão iniciada.`
            : `${values.nome} cadastrado com sucesso.`,
        );
      }

      handleCloseDrawer();
    } catch {
      showToast('Erro ao salvar registro no Firestore.', 'error');
    }
  };

  const handleToggleOnboardingTask = async (
    onboardingId: string,
    taskId: string,
  ) => {
    const current = onboardings.find((item) => item.id === onboardingId);
    if (!current) return;

    const previousStatus = getOnboardingStatus(current);
    const updated = toggleOnboardingTask(current, taskId);
    const nextStatus = getOnboardingStatus(updated);

    try {
      await updateOnboardingTasksInFirestore(
        onboardingId,
        updated.tarefas,
        updated.atualizadaEm,
      );

      if (previousStatus !== nextStatus) {
        const emp = employees.find((e) => e.id === current.colaboradorId);
        const nome = emp?.nome ?? 'Colaborador';
        showToast(
          nextStatus === 'Concluída'
            ? `Admissão de ${nome} pronta para começar (3/3).`
            : `Admissão de ${nome} retornou para Em andamento.`,
        );
      }
    } catch {
      showToast('Erro ao atualizar etapa no Firestore.', 'error');
    }
  };

  const handleUpdateOnboardingStartDate = async (
    onboardingId: string,
    dateStr?: string,
  ) => {
    const current = onboardings.find((item) => item.id === onboardingId);
    if (!current) return;

    const updated = updateOnboardingStartDate(current, dateStr);
    try {
      await updateOnboardingStartDateInFirestore(
        onboardingId,
        updated.dataPrevistaInicio,
        updated.atualizadaEm,
      );
    } catch {
      showToast('Erro ao atualizar data prevista no Firestore.', 'error');
    }
  };

  const handleConfirmCsvImport = async (
    validRows: ParsedCsvRow[],
    summary: { valid: number; duplicate: number; invalid: number },
  ) => {
    const now = new Date().toISOString();
    const existingEmails = new Set(
      employees.map((emp) => normalizeEmail(emp.email)),
    );
    const newRecords: Employee[] = [];

    for (const row of validRows) {
      if (!row.setor || !row.situacao) continue;
      const normalized = normalizeEmail(row.email);
      if (existingEmails.has(normalized)) continue;
      existingEmails.add(normalized);

      newRecords.push({
        id: createEmployeeId(),
        nome: row.nome,
        email: row.email.trim(),
        setor: row.setor,
        situacao: row.situacao,
        atualizadoEm: now,
      });
    }

    try {
      await importEmployeesBatchToFirestore(newRecords);
      setIsCsvModalOpen(false);

      const extras: string[] = [];
      if (summary.duplicate > 0) {
        extras.push(`${summary.duplicate} duplicado(s) ignorado(s)`);
      }
      if (summary.invalid > 0) {
        extras.push(`${summary.invalid} inválido(s) ignorado(s)`);
      }

      showToast(
        extras.length > 0
          ? `Importação concluída: ${newRecords.length} adicionado(s) (${extras.join(', ')}).`
          : `Importação concluída: ${newRecords.length} colaborador(es) adicionado(s).`,
      );
    } catch {
      showToast('Erro ao importar colaboradores para o Firestore.', 'error');
    }
  };

  const handleLoadDemoData = async () => {
    const now = new Date().toISOString();
    const currentEmails = new Set(
      employees.map((emp) => normalizeEmail(emp.email)),
    );
    const additions: Employee[] = [];

    for (const seed of DEMO_EMPLOYEES_SEED) {
      const normalized = normalizeEmail(seed.email);
      if (currentEmails.has(normalized)) continue;
      currentEmails.add(normalized);
      additions.push({
        id: createEmployeeId(),
        nome: seed.nome,
        email: seed.email,
        setor: seed.setor,
        situacao: seed.situacao,
        atualizadoEm: now,
      });
    }

    if (additions.length === 0) {
      showToast('Os registros de exemplo já estão presentes no Firestore.');
      return;
    }

    try {
      await importEmployeesBatchToFirestore(additions);
      showToast(
        `${additions.length} colaborador(es) fictício(s) carregado(s) no Firestore.`,
      );
    } catch {
      showToast('Erro ao carregar dados fictícios no Firestore.', 'error');
    }
  };

  const handleConfirmLocalMigration = async () => {
    if (!localMigrationPending) return;
    setIsMigratingLocal(true);
    try {
      const result = await migrateLocalDataToFirestore(
        localMigrationPending.employees,
        localMigrationPending.onboardings,
        employees,
        onboardings,
      );
      clearStoredEmployees();
      clearStoredOnboardings();
      setLocalMigrationPending(null);
      showToast(
        `Migração concluída: ${result.importedEmployees} colaborador(es) e ${result.importedOnboardings} admissão(ões) enviados ao Firestore.`,
      );
    } catch {
      showToast(
        'Falha na migração para o Firestore. Os dados locais no navegador foram preservados.',
        'error',
      );
    } finally {
      setIsMigratingLocal(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSetorFilter('Todos');
    setSituacaoFilter('Todas');
  };

  const handleClearAllData = async () => {
    try {
      await clearAllFirestoreData(employees, onboardings);
      handleClearFilters();
      setSelectedOnboardingId(null);
      setConfirmClearBase(false);
      showToast(
        'Todos os colaboradores e admissões armazenados no Firestore foram removidos.',
      );
    } catch {
      showToast('Erro ao limpar os registros no Firestore.', 'error');
    }
  };

  if (authState === 'loading') {
    return (
      <CheckingAuthScreen message="Inicializando autenticação..." />
    );
  }

  if (authState === 'visitor') {
    return (
      <LoginScreen
        isSigningIn={isSigningIn}
        errorMessage={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  if (authState === 'checking-permission') {
    return (
      <CheckingAuthScreen message="Verificando permissão de acesso..." />
    );
  }

  if (authState === 'unauthorized' && currentUser) {
    return (
      <UnauthorizedScreen
        uid={currentUser.uid}
        email={currentUser.email}
        errorMessage={authError}
        isRechecking={isRecheckingAuth}
        onRecheck={handleRecheckAuthorization}
        onSignOut={handleSignOut}
      />
    );
  }

  const pageHeading = {
    admissoes: {
      title: 'Admissões',
      subtitle:
        'Linha do tempo dos próximos sete dias, admissões a agendar e lista completa de checklists.',
    },
    'visao-geral': {
      title: 'Visão geral',
      subtitle:
        'Indicadores consolidados da base completa de colaboradores e admissões em andamento.',
    },
    colaboradores: {
      title: 'Colaboradores',
      subtitle:
        'Cadastro, busca por nome, filtros por setor e situação, edição e importação CSV.',
    },
  }[activeTab];

  const editingOnboarding = editingEmployee
    ? onboardingsByEmployeeId.get(editingEmployee.id) ?? null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-[#163459] bg-[#0F2744] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2.5 px-4 py-3 sm:px-6 lg:px-8 md:flex-nowrap md:gap-8 md:py-3.5">
          <button
            type="button"
            onClick={() => {
              setSelectedOnboardingId(null);
              setActiveTab('admissoes');
            }}
            className="min-w-[160px] flex-1 basis-[175px] text-left text-[15px] font-semibold leading-tight tracking-tight text-white sm:text-lg md:basis-auto md:flex-none md:whitespace-nowrap md:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
          >
            Sistema de Gestão de Colaboradores
          </button>

          <nav
            aria-label="Áreas da aplicação"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id !== 'admissoes') {
                      setSelectedOnboardingId(null);
                    }
                    setActiveTab(tab.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewDrawer}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3.5 sm:px-4 text-sm font-medium text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2744] transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Novo colaborador</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sair da conta"
              title={
                currentUser?.email
                  ? `Sair (${currentUser.email})`
                  : 'Sair da conta'
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-500/60 bg-transparent px-3 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2744] transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Navegação móvel"
          className="flex items-center justify-between gap-2 border-t border-[#1A3B66] px-4 py-2 min-[400px]:justify-start min-[400px]:gap-6 sm:px-6 md:hidden"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id !== 'admissoes') {
                    setSelectedOnboardingId(null);
                  }
                  setActiveTab(tab.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1.5 text-[13px] sm:text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-t ${
                  isActive
                    ? 'border-blue-400 text-white'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {localMigrationPending && !migrationDismissed && (
          <section
            aria-label="Migração de dados locais da versão 3.1"
            className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Dados locais da versão 3.1 encontrados neste navegador
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Existem {localMigrationPending.employees.length} colaborador(es) e{' '}
                  {localMigrationPending.onboardings.length} checklist(s) salvos localmente. Eles permanecem preservados até você confirmar a migração para o Firestore.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isMigratingLocal}
                onClick={handleConfirmLocalMigration}
                className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
              >
                {isMigratingLocal
                  ? 'Migrando...'
                  : 'Confirmar migração para o Firestore'}
              </button>
              <button
                type="button"
                disabled={isMigratingLocal}
                onClick={() => setMigrationDismissed(true)}
                className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap"
              >
                Manter no navegador por enquanto
              </button>
            </div>
          </section>
        )}

        {firestoreErrorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{firestoreErrorMessage}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-balance">
              {pageHeading.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {pageHeading.subtitle}
              {currentUser?.email ? ` · Sessão: ${currentUser.email}` : ''}
            </p>
          </div>

          {(employees.length > 0 || onboardings.length > 0) && (
            <div className="flex items-center gap-3 shrink-0">
              {!confirmClearBase ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearBase(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpar base
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs">
                  <span className="font-medium text-slate-700">
                    Apaga colaboradores e admissões no Firestore. Confirmar?
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="font-semibold text-rose-600 hover:text-rose-700 focus-visible:outline-none focus-visible:underline"
                  >
                    Confirmar
                  </button>
                  <span className="text-slate-300" aria-hidden="true">
                    |
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmClearBase(false)}
                    className="font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:underline"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isSyncingData ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
            Carregando colaboradores e admissões do Firestore...
          </div>
        ) : (
          <>
            {activeTab === 'admissoes' && (
              <OnboardingSection
                employees={employees}
                onboardings={onboardings}
                selectedOnboardingId={selectedOnboardingId}
                onSelectOnboarding={setSelectedOnboardingId}
                onToggleTask={handleToggleOnboardingTask}
                onUpdateStartDate={handleUpdateOnboardingStartDate}
                onStartOnboarding={(colaboradorId, dataPrevistaInicio) => {
                  void handleStartOnboardingForEmployee(
                    colaboradorId,
                    dataPrevistaInicio,
                  );
                }}
                onNavigate={(tab) => {
                  setSelectedOnboardingId(null);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === 'visao-geral' && (
              <OverviewSection
                employees={employees}
                onboardings={onboardings}
                onNavigate={(tab) => {
                  setSelectedOnboardingId(null);
                  setActiveTab(tab);
                }}
                onNewEmployee={handleOpenNewDrawer}
                onOpenImport={() => setIsCsvModalOpen(true)}
                onLoadDemo={() => {
                  void handleLoadDemoData();
                }}
              />
            )}

            {activeTab === 'colaboradores' && (
              <section
                aria-label="Filtros e listagem de colaboradores"
                className="space-y-4"
              >
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative min-w-0 w-full lg:w-auto lg:flex-1 lg:min-w-[220px]">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar colaborador por nome..."
                      aria-label="Buscar colaborador por nome"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpar busca"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="filtro-setor"
                        className="text-xs font-medium text-slate-600 whitespace-nowrap"
                      >
                        Setor
                      </label>
                      <select
                        id="filtro-setor"
                        value={setorFilter}
                        onChange={(e) =>
                          setSetorFilter(e.target.value as SetorFilter)
                        }
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
                      >
                        <option value="Todos">Todos os setores</option>
                        {SETORES.map((setor) => (
                          <option key={setor} value={setor}>
                            {setor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className="flex items-center gap-1 rounded-md bg-slate-100 p-1"
                      role="group"
                      aria-label="Filtrar por situação"
                    >
                      {(['Todas', 'Ativo', 'Inativo'] as const).map(
                        (situacao) => {
                          const active = situacaoFilter === situacao;
                          return (
                            <button
                              key={situacao}
                              type="button"
                              onClick={() => setSituacaoFilter(situacao)}
                              className={`h-8 rounded px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                active
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {situacao}
                            </button>
                          );
                        },
                      )}
                    </div>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-10 rounded-md px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                      >
                        Limpar filtros
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCsvModalOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Upload className="h-4 w-4 text-slate-500" />
                      Importar CSV
                    </button>
                  </div>
                </div>

                {employees.length > 0 && (
                  <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      Exibindo {filteredEmployees.length} de {employees.length}{' '}
                      registro(s)
                    </span>
                    {hasActiveFilters && (
                      <span>
                        Os indicadores da Visão geral consideram a base completa
                      </span>
                    )}
                  </div>
                )}

                <EmployeeTable
                  employees={filteredEmployees}
                  onboardingsByEmployeeId={onboardingsByEmployeeId}
                  totalCount={employees.length}
                  hasActiveFilters={hasActiveFilters}
                  onEdit={handleOpenEditDrawer}
                  onStartOnboarding={(colaboradorId) => {
                    void handleStartOnboardingForEmployee(colaboradorId);
                  }}
                  onViewOnboarding={handleViewOnboarding}
                  onNewEmployee={handleOpenNewDrawer}
                  onOpenImport={() => setIsCsvModalOpen(true)}
                  onLoadDemo={() => {
                    void handleLoadDemoData();
                  }}
                  onClearFilters={handleClearFilters}
                />
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Sistema de Gestão de Colaboradores · Projeto Acadêmico de RH</span>
          <span>Dados fictícios protegidos por Firebase Auth e Cloud Firestore</span>
        </div>
      </footer>

      <EmployeeDrawer
        isOpen={isDrawerOpen}
        editingEmployee={editingEmployee}
        editingOnboarding={editingOnboarding}
        existingEmployees={employees}
        onClose={handleCloseDrawer}
        onSubmit={handleSaveEmployee}
        onViewOnboarding={handleViewOnboarding}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        existingEmployees={employees}
        onClose={() => setIsCsvModalOpen(false)}
        onConfirmImport={handleConfirmCsvImport}
      />

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={`fixed bottom-5 right-5 z-40 flex max-w-md items-center gap-2.5 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-rose-200 text-rose-800'
              : 'border-slate-200 text-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fechar aviso"
            className="ml-2 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
