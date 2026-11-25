# Registro de Testes e Verificação de Segurança

Este documento registra os cenários testados no **Sistema de Gestão de Colaboradores**, os resultados reais obtidos nesta auditoria, as correções aplicadas e os testes que permanecem pendentes por dependerem de interação manual com Login Google e Console do Firebase.

---

## 1. Resumo dos Testes Executados x Pendentes

| Categoria | Executados e Aprovados | Reprovados | Não Executados (Pendentes) |
|---|---|---|---|
| **Build, Tipagem e Lint de Regras** | 3 | 0 | 0 |
| **Auditoria de Dependências (`bun audit`)** | 1 *(informativo)* | 0 | 0 |
| **Testes Automatizados de Domínio (`tsx`)** | 3 suítes de asserções | 0 | 0 |
| **Navegador Headless (Modo Visitante / Responsividade)** | 1 suíte (`320`, `390`, `1280 px`) | 0 | 0 |
| **Fluxos Ao Vivo Firebase Auth + Firestore** | 0 | 0 | 4 |

---

## 2. Tabela Detalhada de Testes

| ID | Teste | Descrição | Resultado | Situação | Correções / Observações |
|---|---|---|---|---|---|
| **T-01** | Checagem TypeScript (`npm run lint`) | Execução de `tsc --noEmit` sobre todo o código em `src/` | Concluído com código `0` e zero erros de tipo ou importação | **Aprovado** | Mantido íntegro após ajustes finais |
| **T-02** | Build de produção (`npm run build`) | Execução de `vite build` para geração do bundle estático em `dist/` | Bundle gerado com sucesso (`Build succeeded`) | **Aprovado** | Nenhuma |
| **T-03** | Análise estática de segurança (`npx eslint firestore.rules`) | Verificação das regras em `firestore.rules` com `@firebase/eslint-plugin-security-rules` | Código `0`, zero erros e zero alertas de segurança | **Aprovado** | Nenhuma |
| **T-04** | Auditoria de dependências (`bun audit`) | Inspeção somente leitura de vulnerabilidades conhecidas no `bun.lock` | Reportou 3 alertas transitivos: `@grpc/grpc-js` (`high`/`low` dentro de `firebase`) e `minimatch` (`moderate` dentro de `eslint`/`@firebase/eslint-plugin-security-rules`) | **Aprovado** *(informativo)* | Documentado como alerta transitivo conhecido sem segredos expostos |
| **T-05** | Validação de colaborador e IDs (`tsx`) | Testes unitários em `employeeStorage.ts`: normalização de e-mail, rejeição de nome `< 2` ou `> 160` chars, e-mail inválido, ID com `../` e busca sem acentos | Todas as asserções passaram (`ALL_UNIT_ASSERTIONS_PASSED`) | **Aprovado** | Sincronizados limites `2..160` e `5..254` entre cliente e `firestore.rules` |
| **T-06** | Parser e pré-via CSV (`tsx`) | Testes em `csvParser.ts`: remoção de BOM UTF-8, delimitador `,`, duplicidade case-insensitive na base e no arquivo, rejeição de nome de 1 caractere, setor `DE` e e-mail inválido | 2 válidos, 2 duplicados e 3 inválidos classificados corretamente | **Aprovado** | Corrigida lacuna em `csvParser.ts` que antes aceitava nome de 1 caractere |
| **T-07** | Fluxo de admissões e linha do tempo (`tsx`) | Testes em `onboardingStorage.ts`: 1 admissão por colaborador, status `a-agendar`, `inicio-proximo`, `atrasada`, conclusão `3/3` (`Pronta para começar`), reabertura `2/3` (`Em andamento`) e rejeição de `2026-02-31` | Todas as transições de estado e validações de data passaram | **Aprovado** | Adicionada checagem explícita `isValidLocalDateString` no envio do `EmployeeDrawer` |
| **T-08** | Acesso como visitante e responsividade (Chromium headless) | Abertura de `http://127.0.0.1:3000` sem sessão nas larguras `320 px`, `390 px` e `1280 px` | `exceptions: []`, exibiu `Entrar no painel de RH` e `Entrar com Google`, ocultou `Novo colaborador` / dados protegidos e manteve `scrollWidth === innerWidth` nas 3 larguras | **Aprovado** | Adicionada checagem prévia de `user.emailVerified` e toast diferenciado para erros em `App.tsx` |
| **T-09** | Emulador local do Firestore (`firebase emulators:exec`) | Simular leitura/gravação com tokens autorizados e não autorizados contra `firestore.rules` localmente | Não foi possível executar porque o binário `java` não está instalado no ambiente (`java: not found`) | **Não executado** | Executar no **Rules Playground** do Firebase Console ou em máquina local com JDK |
| **T-10** | Login Google ao vivo com conta **não autorizada** | Autenticar conta Google cujo UID não exista em `authorized_users` | Requer interação OAuth Google real de conta não cadastrada | **Não executado** | Pendente de teste manual pelo estudante no preview |
| **T-11** | Cadastro do 1º UID e botão **Verificar novamente** | Cadastrar documento em `authorized_users/{UID}` no Firestore Console e clicar em **Verificar novamente** | Requer acesso manual ao Console Firebase + sessão Google real | **Não executado** | Pendente de teste manual pelo estudante |
| **T-12** | CRUD, CSV, checklist e **Sair** com conta **autorizada** | Criar/editar colaborador, importar CSV, concluir checklist `3/3` no Firestore real e clicar em **Sair** confirmando limpeza dos dados | Requer conta Google real autorizada no Firestore | **Não executado** | Pendente de teste manual e captura das evidências em `docs/evidencias/` |

---

## 3. Verificações Específicas de Segurança Realizadas

1. **Bloqueio padrão e isolamento de `authorized_users`**: Confirmado em `firestore.rules` que qualquer caminho não mapeado é negado (`allow read, write: if false`) e que usuários do aplicativo só podem consultar (`get`) o próprio documento `/authorized_users/{uid}`, sendo impedidos de listar (`list`) ou modificar (`create`, `update`, `delete`) a lista de permissões.
2. **Revisão de credenciais antes do GitHub**: Confirmado que não existem arquivos `.env` reais, tokens OAuth privados, chaves de *Service Account* nem senhas hardcoded no repositório. O arquivo `.gitignore` bloqueia `.env*` (preservando `!.env.example`), `.firebase/`, logs e `.aistudio/`.
3. **Dados fictícios**: Os registros de exemplo em `src/utils/employeeStorage.ts` (`DEMO_EMPLOYEES_SEED` e `DEMO_CSV_CONTENT`) utilizam exclusivamente nomes e endereços fictícios no domínio `@empresa-modelo.com.br`.

---

## 4. Como Executar os Testes Localmente

```bash
# 1. Checagem de tipos TypeScript
npm run lint

# 2. Compilação de produção
npm run build

# 3. Auditoria das regras do Firestore
npx eslint firestore.rules

# 4. Auditoria de dependências (opcional, quando usar Bun)
bun audit
```
