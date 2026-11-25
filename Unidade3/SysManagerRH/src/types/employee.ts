export const SETORES = ['RH', 'TI', 'Financeiro', 'Operações'] as const;
export type Setor = (typeof SETORES)[number];

export const SITUACOES = ['Ativo', 'Inativo'] as const;
export type Situacao = (typeof SITUACOES)[number];

export interface Employee {
  id: string;
  nome: string;
  email: string;
  setor: Setor;
  situacao: Situacao;
  atualizadoEm: string;
}

export interface EmployeeFormValues {
  nome: string;
  email: string;
  setor: Setor | '';
  situacao: Situacao | '';
}

export const ONBOARDING_DEFAULT_TASKS = [
  'Validar documentação',
  'Solicitar acesso aos sistemas',
  'Agendar integração',
] as const;

export const ONBOARDING_SEGMENT_LABELS = [
  'Documentação',
  'Acessos',
  'Integração',
] as const;

export type OnboardingStatus = 'Em andamento' | 'Concluída';

export interface OnboardingTask {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface Onboarding {
  id: string;
  colaboradorId: string;
  tarefas: OnboardingTask[];
  dataPrevistaInicio?: string;
  criadaEm: string;
  atualizadaEm: string;
}

export type AppTab = 'admissoes' | 'visao-geral' | 'colaboradores';
