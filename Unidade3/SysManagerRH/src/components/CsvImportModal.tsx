import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Employee } from '../types/employee';
import { CsvParseResult, ParsedCsvRow, parseAndValidateCsv } from '../utils/csvParser';
import { DEMO_CSV_CONTENT } from '../utils/employeeStorage';

interface CsvImportModalProps {
  isOpen: boolean;
  existingEmployees: Employee[];
  onClose: () => void;
  onConfirmImport: (
    validRows: ParsedCsvRow[],
    summary: { valid: number; duplicate: number; invalid: number },
  ) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  existingEmployees,
  onClose,
  onConfirmImport,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [readError, setReadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName('');
    setRawContent('');
    setParseResult(null);
    setReadError('');
    setIsDragging(false);
  }, [isOpen]);

  useEffect(() => {
    if (!rawContent) return;
    setParseResult(parseAndValidateCsv(rawContent, existingEmployees));
  }, [rawContent, existingEmployees]);

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

  const processFile = (file: File) => {
    setReadError('');
    const isCsv =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel';

    if (!isCsv) {
      setReadError('Selecione um arquivo com extensão .csv.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setFileName(file.name);
      setRawContent(content);
    };
    reader.onerror = () => {
      setReadError('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadDemoCsv = () => {
    const blob = new Blob([DEMO_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'colaboradores_demonstracao.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    if (!parseResult || parseResult.validRows.length === 0) return;
    onConfirmImport(parseResult.validRows, {
      valid: parseResult.validRows.length,
      duplicate: parseResult.duplicateRows.length,
      invalid: parseResult.invalidRows.length,
    });
  };

  const statusLabel = (row: ParsedCsvRow) => {
    if (row.status === 'valid') return 'Válido';
    if (row.status === 'duplicate') return 'Duplicado';
    return 'Inválido';
  };

  const statusColor = (row: ParsedCsvRow) => {
    if (row.status === 'valid') return 'text-emerald-700 font-medium';
    if (row.status === 'duplicate') return 'text-amber-700 font-medium';
    return 'text-rose-700 font-medium';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="csv-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Importar CSV de colaboradores
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Cabeçalho esperado:{' '}
              <code className="font-mono text-xs text-slate-700">
                Nome,E-mail profissional,Setor,Situação
              </code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de importação"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {!parseResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 bg-slate-50/60'
              }`}
            >
              <FileSpreadsheet className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-800">
                Arraste seu arquivo CSV para cá ou selecione do computador
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Setores aceitos: RH, TI, Financeiro ou Operações. E-mails duplicados são ignorados automaticamente.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="h-4 w-4" />
                  Selecionar arquivo CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDemoCsv}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Baixar CSV modelo
                </button>
              </div>
            </div>
          )}

          {readError && (
            <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{readError}</span>
            </div>
          )}

          {parseResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    Arquivo: {fileName}
                  </p>
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {parseResult.rows.length} linha(s) analisada(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRawContent('');
                    setParseResult(null);
                    setFileName('');
                  }}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
                >
                  Escolher outro arquivo
                </button>
              </div>

              {parseResult.headerError ? (
                <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{parseResult.headerError}</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-white">
                    <div className="px-4 py-3">
                      <span className="block text-xs font-medium text-slate-500">
                        Válidos (importar)
                      </span>
                      <span className="mt-1 block font-mono text-xl font-semibold text-emerald-700 tabular-nums">
                        {parseResult.validRows.length}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <span className="block text-xs font-medium text-slate-500">
                        Duplicados (ignorados)
                      </span>
                      <span className="mt-1 block font-mono text-xl font-semibold text-amber-700 tabular-nums">
                        {parseResult.duplicateRows.length}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <span className="block text-xs font-medium text-slate-500">
                        Inválidos (ignorados)
                      </span>
                      <span className="mt-1 block font-mono text-xl font-semibold text-rose-700 tabular-nums">
                        {parseResult.invalidRows.length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">Linha</th>
                          <th className="px-3 py-2.5 font-medium">Nome</th>
                          <th className="px-3 py-2.5 font-medium">E-mail profissional</th>
                          <th className="px-3 py-2.5 font-medium">Setor</th>
                          <th className="px-3 py-2.5 font-medium">Situação</th>
                          <th className="px-3 py-2.5 font-medium">Análise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parseResult.rows.map((row) => (
                          <tr key={`${row.lineNumber}_${row.email}`} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2.5 font-mono text-slate-500 tabular-nums">
                              {row.lineNumber}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-900">
                              {row.nome || '—'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {row.email || '—'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.setor ?? (row.rawSetor || '—')}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.situacao ?? (row.rawSituacao || '—')}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={statusColor(row)}>
                                {statusLabel(row)}
                              </span>
                              {row.reason && (
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {row.reason}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
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
            type="button"
            disabled={!parseResult || parseResult.validRows.length === 0}
            onClick={handleConfirm}
            className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors whitespace-nowrap shrink-0"
          >
            Confirmar importação
            {parseResult && parseResult.validRows.length > 0
              ? ` (${parseResult.validRows.length})`
              : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
