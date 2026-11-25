import {
  collection,
  deleteField,
  doc,
  getDocFromServer,
  onSnapshot,
  writeBatch,
  setDoc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import {
  Employee,
  ONBOARDING_DEFAULT_TASKS,
  Onboarding,
  OnboardingTask,
  SETORES,
  SITUACOES,
  Setor,
  Situacao,
} from '../types/employee';
import {
  OperationType,
  auth,
  db,
  handleFirestoreError,
} from '../firebase';
import {
  EMPLOYEE_EMAIL_MAX_LENGTH,
  EMPLOYEE_NAME_MAX_LENGTH,
  createEmployeeId,
  isValidDocumentId,
  isValidEmail,
  isValidEmployeeName,
  normalizeEmail,
} from './employeeStorage';
import { isValidLocalDateString } from './onboardingStorage';

const COLABORADORES_COLLECTION = 'colaboradores';
const ADMISSOES_COLLECTION = 'admissoes';
const AUTHORIZED_USERS_COLLECTION = 'authorized_users';

function isValidSetor(value: unknown): value is Setor {
  return typeof value === 'string' && (SETORES as readonly string[]).includes(value);
}

function isValidSituacao(value: unknown): value is Situacao {
  return typeof value === 'string' && (SITUACOES as readonly string[]).includes(value);
}

function sanitizeDocumentId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : createEmployeeId();
}

function normalizeIsoTimestamp(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length >= 10 && trimmed.length <= 40) {
      return trimmed;
    }
  }
  return new Date().toISOString();
}

function sanitizeOnboardingTasks(tasks: OnboardingTask[]): OnboardingTask[] {
  return ONBOARDING_DEFAULT_TASKS.map((defaultTitle, index) => {
    const source = tasks[index];
    const rawId =
      typeof source?.id === 'string' && source.id.trim().length > 0
        ? source.id.trim().slice(0, 40)
        : `tarefa_${index + 1}`;
    const rawTitle =
      typeof source?.titulo === 'string' && source.titulo.trim().length > 0
        ? source.titulo.trim().slice(0, 120)
        : defaultTitle;
    return {
      id: rawId,
      titulo: rawTitle,
      concluida: Boolean(source?.concluida),
    };
  });
}

export async function checkUserAuthorization(uid: string): Promise<boolean> {
  if (!isValidDocumentId(uid)) {
    return false;
  }
  const path = `${AUTHORIZED_USERS_COLLECTION}/${uid}`;
  try {
    const snap = await getDocFromServer(doc(db, AUTHORIZED_USERS_COLLECTION, uid));
    return snap.exists();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('permission-denied') ||
      message.includes('Missing or insufficient permissions')
    ) {
      return false;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeEmployees(
  onData: (employees: Employee[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, COLABORADORES_COLLECTION),
    (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          typeof data.nome === 'string' &&
          data.nome.trim().length > 0 &&
          typeof data.email === 'string' &&
          isValidEmail(data.email) &&
          isValidSetor(data.setor) &&
          isValidSituacao(data.situacao)
        ) {
          items.push({
            id: typeof data.id === 'string' ? data.id : docSnap.id,
            nome: data.nome,
            email: data.email,
            setor: data.setor,
            situacao: data.situacao,
            atualizadoEm:
              typeof data.atualizadoEm === 'string'
                ? data.atualizadoEm
                : new Date().toISOString(),
          });
        }
      });

      items.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLABORADORES_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export function subscribeOnboardings(
  onData: (onboardings: Onboarding[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, ADMISSOES_COLLECTION),
    (snapshot) => {
      const items: Onboarding[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          typeof data.colaboradorId !== 'string' ||
          !Array.isArray(data.tarefas)
        ) {
          return;
        }

        const validTasks = data.tarefas.filter(
          (t: unknown): t is OnboardingTask =>
            Boolean(t) &&
            typeof t === 'object' &&
            typeof (t as OnboardingTask).id === 'string' &&
            typeof (t as OnboardingTask).titulo === 'string' &&
            typeof (t as OnboardingTask).concluida === 'boolean',
        );

        if (validTasks.length !== ONBOARDING_DEFAULT_TASKS.length) {
          return;
        }

        const validDate = isValidLocalDateString(data.dataPrevistaInicio)
          ? data.dataPrevistaInicio
          : undefined;

        items.push({
          id: typeof data.id === 'string' ? data.id : docSnap.id,
          colaboradorId: data.colaboradorId,
          tarefas: validTasks,
          ...(validDate ? { dataPrevistaInicio: validDate } : {}),
          criadaEm:
            typeof data.criadaEm === 'string'
              ? data.criadaEm
              : new Date().toISOString(),
          atualizadaEm:
            typeof data.atualizadaEm === 'string'
              ? data.atualizadaEm
              : new Date().toISOString(),
        });
      });

      items.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, ADMISSOES_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function createEmployeeInFirestore(
  employee: Employee,
  optionalOnboarding?: Onboarding | null,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  const empId = sanitizeDocumentId(employee.id);
  const empPayload: Record<string, unknown> = {
    id: empId,
    nome: employee.nome.trim().slice(0, 160),
    email: employee.email.trim().slice(0, 254),
    setor: employee.setor,
    situacao: employee.situacao,
    atualizadoEm: employee.atualizadoEm,
    ...(uid ? { atualizadoPorUid: uid } : {}),
  };

  if (optionalOnboarding) {
    const batch = writeBatch(db);
    batch.set(doc(db, COLABORADORES_COLLECTION, empId), empPayload);

    const admPayload: Record<string, unknown> = {
      id: empId,
      colaboradorId: empId,
      tarefas: optionalOnboarding.tarefas,
      criadaEm: optionalOnboarding.criadaEm,
      atualizadaEm: optionalOnboarding.atualizadaEm,
      ...(isValidLocalDateString(optionalOnboarding.dataPrevistaInicio)
        ? { dataPrevistaInicio: optionalOnboarding.dataPrevistaInicio }
        : {}),
      ...(uid ? { atualizadoPorUid: uid } : {}),
    };
    batch.set(doc(db, ADMISSOES_COLLECTION, empId), admPayload);

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `${COLABORADORES_COLLECTION}/${empId}`,
      );
    }
    return;
  }

  const path = `${COLABORADORES_COLLECTION}/${empId}`;
  try {
    await setDoc(doc(db, COLABORADORES_COLLECTION, empId), empPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEmployeeInFirestore(
  id: string,
  values: {
    nome: string;
    email: string;
    setor: Setor;
    situacao: Situacao;
    atualizadoEm: string;
  },
): Promise<void> {
  const uid = auth.currentUser?.uid;
  const path = `${COLABORADORES_COLLECTION}/${id}`;
  if (!isValidDocumentId(id)) {
    handleFirestoreError(new Error('Identificador de colaborador inválido.'), OperationType.UPDATE, path);
  }
  try {
    await updateDoc(doc(db, COLABORADORES_COLLECTION, id), {
      nome: values.nome.trim().slice(0, EMPLOYEE_NAME_MAX_LENGTH),
      email: values.email.trim().slice(0, EMPLOYEE_EMAIL_MAX_LENGTH),
      setor: values.setor,
      situacao: values.situacao,
      atualizadoEm: normalizeIsoTimestamp(values.atualizadoEm),
      ...(uid ? { atualizadoPorUid: uid } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createOnboardingInFirestore(
  onboarding: Onboarding,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  const colabId = sanitizeDocumentId(onboarding.colaboradorId);
  const path = `${ADMISSOES_COLLECTION}/${colabId}`;

  const payload: Record<string, unknown> = {
    id: colabId,
    colaboradorId: colabId,
    tarefas: sanitizeOnboardingTasks(onboarding.tarefas),
    criadaEm: normalizeIsoTimestamp(onboarding.criadaEm),
    atualizadaEm: normalizeIsoTimestamp(onboarding.atualizadaEm),
    ...(isValidLocalDateString(onboarding.dataPrevistaInicio)
      ? { dataPrevistaInicio: onboarding.dataPrevistaInicio }
      : {}),
    ...(uid ? { atualizadoPorUid: uid } : {}),
  };

  try {
    await setDoc(doc(db, ADMISSOES_COLLECTION, colabId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOnboardingTasksInFirestore(
  admissaoId: string,
  tarefas: OnboardingTask[],
  atualizadaEm: string,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  const path = `${ADMISSOES_COLLECTION}/${admissaoId}`;
  if (!isValidDocumentId(admissaoId)) {
    handleFirestoreError(new Error('Identificador de admissão inválido.'), OperationType.UPDATE, path);
  }
  try {
    await updateDoc(doc(db, ADMISSOES_COLLECTION, admissaoId), {
      tarefas: sanitizeOnboardingTasks(tarefas),
      atualizadaEm: normalizeIsoTimestamp(atualizadaEm),
      ...(uid ? { atualizadoPorUid: uid } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOnboardingStartDateInFirestore(
  admissaoId: string,
  dataPrevistaInicio: string | undefined,
  atualizadaEm: string,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  const path = `${ADMISSOES_COLLECTION}/${admissaoId}`;
  if (!isValidDocumentId(admissaoId)) {
    handleFirestoreError(new Error('Identificador de admissão inválido.'), OperationType.UPDATE, path);
  }
  try {
    await updateDoc(doc(db, ADMISSOES_COLLECTION, admissaoId), {
      dataPrevistaInicio: isValidLocalDateString(dataPrevistaInicio)
        ? dataPrevistaInicio
        : deleteField(),
      atualizadaEm: normalizeIsoTimestamp(atualizadaEm),
      ...(uid ? { atualizadoPorUid: uid } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function importEmployeesBatchToFirestore(
  employeesToCreate: Employee[],
): Promise<void> {
  if (employeesToCreate.length === 0) return;
  const uid = auth.currentUser?.uid;
  const CHUNK_SIZE = 400;

  for (let i = 0; i < employeesToCreate.length; i += CHUNK_SIZE) {
    const chunk = employeesToCreate.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const emp of chunk) {
      const empId = sanitizeDocumentId(emp.id);
      batch.set(doc(db, COLABORADORES_COLLECTION, empId), {
        id: empId,
        nome: emp.nome.trim().slice(0, 160),
        email: emp.email.trim().slice(0, 254),
        setor: emp.setor,
        situacao: emp.situacao,
        atualizadoEm: emp.atualizadoEm,
        ...(uid ? { atualizadoPorUid: uid } : {}),
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLABORADORES_COLLECTION);
    }
  }
}

export async function migrateLocalDataToFirestore(
  localEmployees: Employee[],
  localOnboardings: Onboarding[],
  existingEmployees: Employee[],
  existingOnboardings: Onboarding[],
): Promise<{
  importedEmployees: number;
  importedOnboardings: number;
  skippedDuplicates: number;
}> {
  const uid = auth.currentUser?.uid;
  const emailToExistingId = new Map<string, string>();
  for (const emp of existingEmployees) {
    emailToExistingId.set(normalizeEmail(emp.email), emp.id);
  }

  const localIdToTargetId = new Map<string, string>();
  const employeesToWrite: Employee[] = [];
  let skippedDuplicates = 0;

  for (const localEmp of localEmployees) {
    if (!isValidEmployeeName(localEmp.nome) || !isValidEmail(localEmp.email)) {
      continue;
    }
    const normEmail = normalizeEmail(localEmp.email);
    const existingId = emailToExistingId.get(normEmail);
    if (existingId) {
      localIdToTargetId.set(localEmp.id, existingId);
      skippedDuplicates += 1;
      continue;
    }

    const targetId = sanitizeDocumentId(localEmp.id);
    emailToExistingId.set(normEmail, targetId);
    localIdToTargetId.set(localEmp.id, targetId);
    employeesToWrite.push({
      ...localEmp,
      id: targetId,
    });
  }

  const existingOnboardingColabIds = new Set(
    existingOnboardings.map((o) => o.colaboradorId),
  );
  const onboardingsToWrite: Onboarding[] = [];

  for (const localAdm of localOnboardings) {
    const targetColabId = localIdToTargetId.get(localAdm.colaboradorId);
    if (!targetColabId) continue;
    if (existingOnboardingColabIds.has(targetColabId)) continue;

    existingOnboardingColabIds.add(targetColabId);
    onboardingsToWrite.push({
      ...localAdm,
      id: targetColabId,
      colaboradorId: targetColabId,
    });
  }

  const operations: Array<{ col: string; id: string; data: Record<string, unknown> }> = [];
  for (const emp of employeesToWrite) {
    operations.push({
      col: COLABORADORES_COLLECTION,
      id: emp.id,
      data: {
        id: emp.id,
        nome: emp.nome.trim().slice(0, EMPLOYEE_NAME_MAX_LENGTH),
        email: emp.email.trim().slice(0, EMPLOYEE_EMAIL_MAX_LENGTH),
        setor: emp.setor,
        situacao: emp.situacao,
        atualizadoEm: normalizeIsoTimestamp(emp.atualizadoEm),
        ...(uid ? { atualizadoPorUid: uid } : {}),
      },
    });
  }

  for (const adm of onboardingsToWrite) {
    operations.push({
      col: ADMISSOES_COLLECTION,
      id: adm.colaboradorId,
      data: {
        id: adm.colaboradorId,
        colaboradorId: adm.colaboradorId,
        tarefas: sanitizeOnboardingTasks(adm.tarefas),
        criadaEm: normalizeIsoTimestamp(adm.criadaEm),
        atualizadaEm: normalizeIsoTimestamp(adm.atualizadaEm),
        ...(isValidLocalDateString(adm.dataPrevistaInicio)
          ? { dataPrevistaInicio: adm.dataPrevistaInicio }
          : {}),
        ...(uid ? { atualizadoPorUid: uid } : {}),
      },
    });
  }

  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(doc(db, op.col, op.id), op.data);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'migracao_v3_1');
    }
  }

  return {
    importedEmployees: employeesToWrite.length,
    importedOnboardings: onboardingsToWrite.length,
    skippedDuplicates,
  };
}

export async function clearAllFirestoreData(
  employees: Employee[],
  onboardings: Onboarding[],
): Promise<void> {
  const deletions: Array<{ col: string; id: string }> = [
    ...onboardings.map((adm) => ({ col: ADMISSOES_COLLECTION, id: adm.id })),
    ...employees.map((emp) => ({ col: COLABORADORES_COLLECTION, id: emp.id })),
  ];

  const CHUNK_SIZE = 400;
  for (let i = 0; i < deletions.length; i += CHUNK_SIZE) {
    const chunk = deletions.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const del of chunk) {
      batch.delete(doc(db, del.col, del.id));
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'limpar_base');
    }
  }
}
