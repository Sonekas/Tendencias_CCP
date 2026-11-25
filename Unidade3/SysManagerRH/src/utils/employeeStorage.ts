import { Employee, SETORES, SITUACOES, Setor, Situacao } from '../types/employee';

const STORAGE_KEY = 'sgc_colaboradores_v1';

export const EMPLOYEE_NAME_MIN_LENGTH = 2;
export const EMPLOYEE_NAME_MAX_LENGTH = 160;
export const EMPLOYEE_EMAIL_MAX_LENGTH = 254;
export const FIRESTORE_DOC_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidDocumentId(id: string): boolean {
  return FIRESTORE_DOC_ID_REGEX.test(id);
}

export function isValidEmployeeName(nome: string): boolean {
  const trimmed = nome.trim();
  return (
    trimmed.length >= EMPLOYEE_NAME_MIN_LENGTH &&
    trimmed.length <= EMPLOYEE_NAME_MAX_LENGTH
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > EMPLOYEE_EMAIL_MAX_LENGTH) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function createEmployeeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isValidSetor(value: unknown): value is Setor {
  return typeof value === 'string' && (SETORES as readonly string[]).includes(value);
}

function isValidSituacao(value: unknown): value is Situacao {
  return typeof value === 'string' && (SITUACOES as readonly string[]).includes(value);
}

export function loadEmployees(): Employee[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is Employee => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        typeof item.nome === 'string' &&
        isValidEmployeeName(item.nome) &&
        typeof item.email === 'string' &&
        isValidEmail(item.email) &&
        isValidSetor(item.setor) &&
        isValidSituacao(item.situacao)
      );
    });
  } catch {
    return [];
  }
}

export function saveEmployees(employees: Employee[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch {
    // Ignora falha silenciosa caso o armazenamento esteja indisponível
  }
}

export function clearStoredEmployees(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora erro de remoção
  }
}

export const DEMO_EMPLOYEES_SEED: Omit<Employee, 'id' | 'atualizadoEm'>[] = [
  {
    nome: 'Mariana Costa Nogueira',
    email: 'mariana.nogueira@empresa-modelo.com.br',
    setor: 'RH',
    situacao: 'Ativo',
  },
  {
    nome: 'Lucas Henrique Almeida',
    email: 'lucas.almeida@empresa-modelo.com.br',
    setor: 'TI',
    situacao: 'Ativo',
  },
  {
    nome: 'Camila Ferreira Rocha',
    email: 'camila.rocha@empresa-modelo.com.br',
    setor: 'Financeiro',
    situacao: 'Ativo',
  },
  {
    nome: 'Rafael Augusto Mendes',
    email: 'rafael.mendes@empresa-modelo.com.br',
    setor: 'Operações',
    situacao: 'Ativo',
  },
  {
    nome: 'Beatriz Oliveira Santos',
    email: 'beatriz.santos@empresa-modelo.com.br',
    setor: 'TI',
    situacao: 'Inativo',
  },
  {
    nome: 'Thiago Ribeiro Cardoso',
    email: 'thiago.cardoso@empresa-modelo.com.br',
    setor: 'Financeiro',
    situacao: 'Ativo',
  },
  {
    nome: 'Juliana Martins Teixeira',
    email: 'juliana.teixeira@empresa-modelo.com.br',
    setor: 'RH',
    situacao: 'Inativo',
  },
  {
    nome: 'Eduardo Pereira Lima',
    email: 'eduardo.lima@empresa-modelo.com.br',
    setor: 'Operações',
    situacao: 'Ativo',
  },
];

export const DEMO_CSV_CONTENT = [
  'Nome,E-mail profissional,Setor,Situação',
  'Mariana Costa Nogueira,mariana.nogueira@empresa-modelo.com.br,RH,Ativo',
  'Lucas Henrique Almeida,lucas.almeida@empresa-modelo.com.br,TI,Ativo',
  'Camila Ferreira Rocha,camila.rocha@empresa-modelo.com.br,Financeiro,Ativo',
  'Rafael Augusto Mendes,rafael.mendes@empresa-modelo.com.br,Operações,Ativo',
  'Beatriz Oliveira Santos,beatriz.santos@empresa-modelo.com.br,TI,Inativo',
  'Thiago Ribeiro Cardoso,thiago.cardoso@empresa-modelo.com.br,Financeiro,Ativo',
].join('\n');
