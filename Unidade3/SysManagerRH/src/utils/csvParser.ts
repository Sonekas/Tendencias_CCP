import { Employee, Setor, Situacao } from '../types/employee';
import {
  EMPLOYEE_EMAIL_MAX_LENGTH,
  EMPLOYEE_NAME_MAX_LENGTH,
  EMPLOYEE_NAME_MIN_LENGTH,
  isValidEmail,
  normalizeEmail,
  normalizeSearchText,
} from './employeeStorage';

export type CsvRowStatus = 'valid' | 'duplicate' | 'invalid';

export interface ParsedCsvRow {
  lineNumber: number;
  nome: string;
  email: string;
  rawSetor: string;
  rawSituacao: string;
  setor?: Setor;
  situacao?: Situacao;
  status: CsvRowStatus;
  reason?: string;
}

export interface CsvParseResult {
  headerError?: string;
  rows: ParsedCsvRow[];
  validRows: ParsedCsvRow[];
  duplicateRows: ParsedCsvRow[];
  invalidRows: ParsedCsvRow[];
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(headerLine: string): ',' | ';' {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  if (commaCount >= semicolonCount && commaCount > 0) return ',';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

function parseCsvLines(content: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeaderKey(header: string): string {
  return normalizeSearchText(header).replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
}

function resolveColumnIndices(headers: string[]): {
  nomeIdx: number;
  emailIdx: number;
  setorIdx: number;
  situacaoIdx: number;
} {
  const normalized = headers.map(normalizeHeaderKey);

  const nomeIdx = normalized.findIndex((h) =>
    ['nome', 'nome completo', 'colaborador', 'name'].includes(h),
  );
  const emailIdx = normalized.findIndex((h) =>
    ['e mail profissional', 'email profissional', 'e mail', 'email'].includes(h),
  );
  const setorIdx = normalized.findIndex((h) =>
    ['setor', 'departamento', 'area'].includes(h),
  );
  const situacaoIdx = normalized.findIndex((h) =>
    ['situacao', 'status', 'estado'].includes(h),
  );

  return { nomeIdx, emailIdx, setorIdx, situacaoIdx };
}

function parseSetor(raw: string): Setor | undefined {
  const key = normalizeSearchText(raw);
  if (key === 'rh' || key === 'recursos humanos') return 'RH';
  if (key === 'ti' || key === 'tecnologia da informacao') return 'TI';
  if (key === 'financeiro') return 'Financeiro';
  if (key === 'operacoes') return 'Operações';
  return undefined;
}

function parseSituacao(raw: string): Situacao | undefined {
  const key = normalizeSearchText(raw);
  if (key === 'ativo' || key === 'ativa') return 'Ativo';
  if (key === 'inativo' || key === 'inativa') return 'Inativo';
  return undefined;
}

export function parseAndValidateCsv(
  rawContent: string,
  existingEmployees: Employee[],
): CsvParseResult {
  const cleaned = stripBom(rawContent).trim();
  if (!cleaned) {
    return {
      headerError: 'O arquivo CSV selecionado está vazio.',
      rows: [],
      validRows: [],
      duplicateRows: [],
      invalidRows: [],
    };
  }

  const firstLine = cleaned.split(/\r?\n/)[0] ?? '';
  const delimiter = detectDelimiter(firstLine);
  const matrix = parseCsvLines(cleaned, delimiter);

  if (matrix.length === 0) {
    return {
      headerError: 'Nenhuma linha encontrada no arquivo CSV.',
      rows: [],
      validRows: [],
      duplicateRows: [],
      invalidRows: [],
    };
  }

  const headers = matrix[0];
  const { nomeIdx, emailIdx, setorIdx, situacaoIdx } = resolveColumnIndices(headers);

  const missingHeaders: string[] = [];
  if (nomeIdx === -1) missingHeaders.push('Nome');
  if (emailIdx === -1) missingHeaders.push('E-mail profissional');
  if (setorIdx === -1) missingHeaders.push('Setor');
  if (situacaoIdx === -1) missingHeaders.push('Situação');

  if (missingHeaders.length > 0) {
    return {
      headerError: `Cabeçalho incompatível. Colunas ausentes: ${missingHeaders.join(', ')}. Use o padrão: Nome,E-mail profissional,Setor,Situação.`,
      rows: [],
      validRows: [],
      duplicateRows: [],
      invalidRows: [],
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length === 0) {
    return {
      headerError: 'O CSV possui apenas o cabeçalho, sem registros de colaboradores.',
      rows: [],
      validRows: [],
      duplicateRows: [],
      invalidRows: [],
    };
  }

  const existingEmails = new Set(existingEmployees.map((emp) => normalizeEmail(emp.email)));
  const seenCsvEmails = new Set<string>();

  const rows: ParsedCsvRow[] = [];
  const validRows: ParsedCsvRow[] = [];
  const duplicateRows: ParsedCsvRow[] = [];
  const invalidRows: ParsedCsvRow[] = [];

  dataRows.forEach((cells, index) => {
    const lineNumber = index + 2;
    const nome = (cells[nomeIdx] ?? '').trim();
    const email = (cells[emailIdx] ?? '').trim();
    const rawSetor = (cells[setorIdx] ?? '').trim();
    const rawSituacao = (cells[situacaoIdx] ?? '').trim();

    const errors: string[] = [];
    if (!nome) {
      errors.push('Nome obrigatório');
    } else if (nome.length < EMPLOYEE_NAME_MIN_LENGTH) {
      errors.push(`Nome deve ter pelo menos ${EMPLOYEE_NAME_MIN_LENGTH} caracteres`);
    } else if (nome.length > EMPLOYEE_NAME_MAX_LENGTH) {
      errors.push(`Nome deve ter no máximo ${EMPLOYEE_NAME_MAX_LENGTH} caracteres`);
    }

    if (!email) {
      errors.push('E-mail obrigatório');
    } else if (email.length > EMPLOYEE_EMAIL_MAX_LENGTH) {
      errors.push(`E-mail deve ter no máximo ${EMPLOYEE_EMAIL_MAX_LENGTH} caracteres`);
    } else if (!isValidEmail(email)) {
      errors.push('E-mail em formato inválido');
    }

    const setor = parseSetor(rawSetor);
    if (!setor) {
      errors.push('Setor deve ser RH, TI, Financeiro ou Operações');
    }

    const situacao = parseSituacao(rawSituacao);
    if (!situacao) {
      errors.push('Situação deve ser Ativo ou Inativo');
    }

    if (errors.length > 0) {
      const invalidRow: ParsedCsvRow = {
        lineNumber,
        nome,
        email,
        rawSetor,
        rawSituacao,
        setor,
        situacao,
        status: 'invalid',
        reason: errors.join('; '),
      };
      rows.push(invalidRow);
      invalidRows.push(invalidRow);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (existingEmails.has(normalizedEmail)) {
      const duplicateRow: ParsedCsvRow = {
        lineNumber,
        nome,
        email,
        rawSetor,
        rawSituacao,
        setor,
        situacao,
        status: 'duplicate',
        reason: 'E-mail já cadastrado na base atual (ignorado sem sobrescrever)',
      };
      rows.push(duplicateRow);
      duplicateRows.push(duplicateRow);
      return;
    }

    if (seenCsvEmails.has(normalizedEmail)) {
      const duplicateRow: ParsedCsvRow = {
        lineNumber,
        nome,
        email,
        rawSetor,
        rawSituacao,
        setor,
        situacao,
        status: 'duplicate',
        reason: 'E-mail repetido dentro do próprio arquivo CSV',
      };
      rows.push(duplicateRow);
      duplicateRows.push(duplicateRow);
      return;
    }

    seenCsvEmails.add(normalizedEmail);
    const validRow: ParsedCsvRow = {
      lineNumber,
      nome,
      email,
      rawSetor,
      rawSituacao,
      setor,
      situacao,
      status: 'valid',
    };
    rows.push(validRow);
    validRows.push(validRow);
  });

  return {
    rows,
    validRows,
    duplicateRows,
    invalidRows,
  };
}
