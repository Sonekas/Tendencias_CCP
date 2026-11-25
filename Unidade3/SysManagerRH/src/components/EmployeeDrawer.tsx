import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import {
  Employee,
  EmployeeFormValues,
  Onboarding,
  SETORES,
  SITUACOES,
  Setor,
  Situacao,
} from '../types/employee';
import {
  EMPLOYEE_EMAIL_MAX_LENGTH,
  EMPLOYEE_NAME_MAX_LENGTH,
  EMPLOYEE_NAME_MIN_LENGTH,
  isValidEmail,
  normalizeEmail,
} from '../utils/employeeStorage';
import {
  formatDisplayDatePtBr,
  getOnboardingCompletedCount,
  getOnboardingStatus,
  getOnboardingTotalCount,
  isValidLocalDateString,
} from '../utils/onboardingStorage';

interface EmployeeDrawerProps {
  isOpen: boolean;
  editingEmployee: Employee | null;
  editingOnboarding: Onboarding | null;
  existingEmployees: Employee[];
  onClose: () => void;
  onSubmit: (values: {
    nome: string;
    email: string;
    setor: Setor;
    situacao: Situacao;
    iniciarAdmissao: boolean;
    dataPrevistaInicio?: string;
  }) => void;
  onViewOnboarding: (colaboradorId: string) => void;
}

interface FormErrors {
  nome?: string;
  email?: string;
  setor?: string;
  situacao?: string;
}

const INITIAL_VALUES: EmployeeFormValues = {
  nome: '',
  email: '',
  setor: '',
  situacao: '',
};

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  editingEmployee,
  editingOnboarding,
  existingEmployees,
  onClose,
  onSubmit,
  onViewOnboarding,
}) => {
  const [values, setValues] = useState<EmployeeFormValues>(INITIAL_VALUES);
  const [iniciarAdmissao, setIniciarAdmissao] = useState(false);
  const [dataPrevistaInicio, setDataPrevistaInicio] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof EmployeeFormValues, boolean>>({
    nome: false,
    email: false,
    setor: false,
    situacao: false,
  });

  const nomeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingEmployee) {
      setValues({
        nome: editingEmployee.nome,
        email: editingEmployee.email,
        setor: editingEmployee.setor,
        situacao: editingEmployee.situacao,
      });
    } else {
      setValues(INITIAL_VALUES);
    }

    setIniciarAdmissao(false);
    setDataPrevistaInicio('');
    setErrors({});
    setTouched({
      nome: false,
      email: false,
      setor: false,
      situacao: false,
    });

    const timer = window.setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [isOpen, editingEmployee]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateField = (
    field: keyof EmployeeFormValues,
    currentValues: EmployeeFormValues,
  ): string | undefined => {
    if (field === 'nome') {
      const trimmedNome = currentValues.nome.trim();
      if (!trimmedNome) {
        return 'Informe o nome completo do colaborador.';
      }
      if (trimmedNome.length < EMPLOYEE_NAME_MIN_LENGTH) {
        return `O nome deve ter pelo menos ${EMPLOYEE_NAME_MIN_LENGTH} caracteres.`;
      }
      if (trimmedNome.length > EMPLOYEE_NAME_MAX_LENGTH) {
        return `O nome deve ter no máximo ${EMPLOYEE_NAME_MAX_LENGTH} caracteres.`;
      }
      return undefined;
    }

    if (field === 'email') {
      const trimmed = currentValues.email.trim();
      if (!trimmed) {
        return 'Informe o e-mail profissional.';
      }
      if (trimmed.length > EMPLOYEE_EMAIL_MAX_LENGTH) {
        return `O e-mail deve ter no máximo ${EMPLOYEE_EMAIL_MAX_LENGTH} caracteres.`;
      }
      if (!isValidEmail(trimmed)) {
        return 'Formato de e-mail inválido. Exemplo: nome@empresa.com.br';
      }
      const normalized = normalizeEmail(trimmed);
      const duplicate = existingEmployees.find(
        (emp) =>
          emp.id !== editingEmployee?.id &&
          normalizeEmail(emp.email) === normalized,
      );
      if (duplicate) {
        return `Este e-mail já pertence a outro colaborador (${duplicate.nome}).`;
      }
      return undefined;
    }

    if (field === 'setor') {
      if (!currentValues.setor) {
        return 'Selecione um setor (RH, TI, Financeiro ou Operações).';
      }
      return undefined;
    }

    if (field === 'situacao') {
      if (!currentValues.situacao) {
        return 'Selecione a situação (Ativo ou Inativo).';
      }
      return undefined;
    }

    return undefined;
  };

  const validateAll = (currentValues: EmployeeFormValues): FormErrors => {
    return {
      nome: validateField('nome', currentValues),
      email: validateField('email', currentValues),
      setor: validateField('setor', currentValues),
      situacao: validateField('situacao', currentValues),
    };
  };

  const handleFieldChange = <K extends keyof EmployeeFormValues>(
    field: K,
    value: EmployeeFormValues[K],
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (touched[field] || field === 'email') {
      const fieldError = validateField(field, nextValues);
      setErrors((prev) => ({
        ...prev,
        [field]: touched[field]
          ? fieldError
          : field === 'email' && fieldError?.includes('pertence')
            ? fieldError
            : undefined,
      }));
    }
  };

  const handleBlur = (field: keyof EmployeeFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, values);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      nome: true,
      email: true,
      setor: true,
      situacao: true,
    });

    const allErrors = validateAll(values);
    setErrors(allErrors);

    const hasError = Object.values(allErrors).some(Boolean);
    if (hasError || !values.setor || !values.situacao) {
      return;
    }

    const validOptionalDate =
      !editingOnboarding &&
      iniciarAdmissao &&
      isValidLocalDateString(dataPrevistaInicio)
        ? dataPrevistaInicio
        : undefined;

    onSubmit({
      nome: values.nome.trim(),
      email: values.email.trim(),
      setor: values.setor,
      situacao: values.situacao,
      iniciarAdmissao: editingOnboarding ? false : iniciarAdmissao,
      dataPrevistaInicio: validOptionalDate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full flex-col bg-white md:max-w-md md:border-l md:border-slate-200 md:shadow-xl transition-transform duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-slate-900"
            >
              {editingEmployee ? 'Editar colaborador' : 'Novo colaborador'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Todos os quatro campos principais são obrigatórios.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-1 flex-col justify-between overflow-y-auto"
        >
          <div className="space-y-5 px-6 py-6">
            <div>
              <label
                htmlFor="colaborador-nome"
                className="block text-sm font-medium text-slate-700"
              >
                Nome <span className="text-rose-600">*</span>
              </label>
              <input
                ref={nomeInputRef}
                id="colaborador-nome"
                type="text"
                required
                maxLength={EMPLOYEE_NAME_MAX_LENGTH}
                value={values.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                onBlur={() => handleBlur('nome')}
                placeholder="Ex.: Ana Paula Ferreira"
                aria-invalid={Boolean(errors.nome)}
                className={`mt-1.5 block w-full rounded-md border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.nome
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.nome && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.nome}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="colaborador-email"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail profissional <span className="text-rose-600">*</span>
              </label>
              <input
                id="colaborador-email"
                type="email"
                required
                maxLength={EMPLOYEE_EMAIL_MAX_LENGTH}
                value={values.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Ex.: ana.ferreira@empresa.com.br"
                aria-invalid={Boolean(errors.email)}
                className={`mt-1.5 block w-full rounded-md border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="colaborador-setor"
                className="block text-sm font-medium text-slate-700"
              >
                Setor <span className="text-rose-600">*</span>
              </label>
              <select
                id="colaborador-setor"
                required
                value={values.setor}
                onChange={(e) =>
                  handleFieldChange('setor', e.target.value as Setor | '')
                }
                onBlur={() => handleBlur('setor')}
                aria-invalid={Boolean(errors.setor)}
                className={`mt-1.5 block w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  errors.setor
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              >
                <option value="">Selecione o setor</option>
                {SETORES.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
              {errors.setor && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.setor}</span>
                </p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700">
                Situação <span className="text-rose-600">*</span>
              </span>
              <div
                className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1"
                role="radiogroup"
                aria-label="Situação do colaborador"
              >
                {SITUACOES.map((situacao) => {
                  const selected = values.situacao === situacao;
                  return (
                    <button
                      key={situacao}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setTouched((prev) => ({ ...prev, situacao: true }));
                        handleFieldChange('situacao', situacao);
                      }}
                      className={`h-10 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        selected
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {situacao}
                    </button>
                  );
                })}
              </div>
              {errors.situacao && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.situacao}</span>
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-3">
              {editingOnboarding && editingEmployee ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Admissão vinculada
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {getOnboardingStatus(editingOnboarding)}{' '}
                      <span className="font-mono text-xs font-normal text-slate-500 tabular-nums">
                        ({getOnboardingCompletedCount(editingOnboarding)}/
                        {getOnboardingTotalCount(editingOnboarding)})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {editingOnboarding.dataPrevistaInicio
                        ? `Previsão: ${formatDisplayDatePtBr(editingOnboarding.dataPrevistaInicio)}`
                        : 'Sem data prevista (A agendar)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewOnboarding(editingEmployee.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
                  >
                    Ver admissão
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50/70 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={iniciarAdmissao}
                      onChange={(e) => setIniciarAdmissao(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="text-sm">
                      <span className="block font-medium text-slate-900">
                        Iniciar admissão
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Cria automaticamente as 3 tarefas iniciais (Documentação, Acessos e Integração).
                      </span>
                    </div>
                  </label>

                  {iniciarAdmissao && (
                    <div>
                      <label
                        htmlFor="cadastro-data-inicio"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Data prevista de início (opcional)
                      </label>
                      <input
                        id="cadastro-data-inicio"
                        type="date"
                        value={dataPrevistaInicio}
                        onChange={(e) => setDataPrevistaInicio(e.target.value)}
                        className="mt-1.5 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Se não informar, o cartão será listado na seção “A agendar”.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors whitespace-nowrap shrink-0"
            >
              {editingEmployee ? 'Salvar alterações' : 'Cadastrar colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
