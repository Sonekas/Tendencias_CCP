# Uso de Inteligência Artificial e Vibecode no Desenvolvimento

Este documento registra como a inteligência artificial (**Google AI Studio Build**) foi empregada como ferramenta de desenvolvimento assistido (*Vibecode*) na construção, evolução e auditoria do **Sistema de Gestão de Colaboradores**.

> **Esclarecimento importante**: A inteligência artificial foi utilizada **exclusivamente no processo de desenvolvimento** (geração, evolução, revisão e documentação do código). **Não existe nenhum chatbot, assistente ou chamada à API de IA integrada ao funcionamento da aplicação em tempo de execução.**

---

## 1. Dinâmica de Desenvolvimento com Google AI Studio

O projeto evoluiu de forma incremental em cinco ciclos principais:

1. **v1 — Diretório Base e Importação CSV**: Criação da interface limpa em tons frios e azul, padronização dos quatro setores (`RH`, `TI`, `Financeiro`, `Operações`), validações de e-mail único e importador CSV com pré-visualização.
2. **v2 — Áreas Integradas e Fluxo de Admissão**: Organização em **Visão geral**, **Colaboradores** e **Admissões**, com criação automática do checklist de 3 etapas (`0/3` a `3/3`).
3. **v3 / v3.1 — Linha do Tempo de 7 Dias e Responsividade**: Transformação de **Admissões** na tela inicial, adição de `dataPrevistaInicio` opcional, seção **A agendar** e correção de quebra do cabeçalho em telas estreitas (`320`–`430 px`).
4. **v4 — Firebase Authentication e Cloud Firestore**: Migração da persistência local para Cloud Firestore com Login Google e lista de UIDs autorizados em `authorized_users` + regras `firestore.rules`.
5. **Auditoria e Organização Acadêmica**: Revisão completa dos arquivos, alinhamento entre validações do cliente e regras do Firestore, revisão de segurança para GitHub e documentação estruturada.

---

## 2. Registro de Prompts Disponíveis e Exemplos Representativos

> **Nota sobre transparência de histórico**: O início literal dos primeiros prompts da sessão foi compactado/resumido automaticamente pela plataforma antes desta auditoria. Conforme as diretrizes acadêmicas, **não foram inventados prompts históricos literais**. Abaixo estão diferenciados os **prompts/diretrizes reais preservados na sessão** e um **exemplo representativo devidamente identificado** referente à criação inicial.

### 2.1 Prompts e Diretrizes Reais Preservados na Sessão

| Etapa | Registro Preservado (Original / Resumo Fiel da Sessão) | Objetivo | Principais Alterações Geradas |
|---|---|---|---|
| **v1 (Ajustes no plano)** | *"Implemente o plano com estes ajustes: 1. Use o tema claro corporativo minimalista em tons frios e azul. 2. Padronize os setores como RH, TI, Financeiro e Operações ... Corrija todas as ocorrências de DE para TI. 3. O CSV de demonstração usa vírgula e tem o cabeçalho Nome,E-mail profissional,Setor,Situação ... 4. Compare e-mails ignorando espaços ... e maiúsculas/minúsculas ... 5. Comece com a lista vazia."* | Consolidar padrão visual, setores e regras de CSV sem sobrescrever registros existentes | Criação dos componentes de tabela, painel lateral de cadastro/edição e parser CSV com pré-via de válidos, duplicados e inválidos. |
| **v2 (Evolução)** | *"Evolua o projeto atual Sistema de Gestão de Colaboradores. Organize a aplicação em três áreas: 1. Visão geral ... 2. Colaboradores ... 3. Admissões. Ao iniciar uma admissão, crie automaticamente estas três tarefas: Validar documentação, Solicitar acesso aos sistemas, Agendar integração..."* | Expandir o diretório com indicadores globais e checklist de onboarding `0/3` a `3/3` | Criação de `OverviewSection.tsx`, lógica de status independente (`Ativo/Inativo` vs. `Em andamento/Concluída`) e vínculo único por colaborador. |
| **v3 (Linha do tempo)** | *"Evolua a área de Admissões da versão 2 para uma linha do tempo interativa dos próximos sete dias. Ela será a tela principal da demonstração. Adicione uma data prevista de início opcional à admissão..."* | Tornar **Admissões** a tela principal com visão temporal, seção **A agendar** e ficha lateral/tela cheia | Criação de `OnboardingSection.tsx`, `OnboardingCard.tsx`, `OnboardingDrawer.tsx` e estados visuais âmbar/verde. |
| **v3.1 (Correção mobile)** | *"Corrija o cabeçalho responsivo da versão atual ... No teste em uma tela de 390 px, o botão 'Novo colaborador' ficou parcialmente cortado e a página passou a ter 499 px de largura rolável..."* | Corrigir corte de botão e overflow horizontal em `320`, `390` e `430 px` | Ajuste de `flex-wrap` no `<header>`, quebra do título em duas linhas no celular e restrição do scroll horizontal à linha do tempo em `1000 px`. |
| **v4 (Controle de acesso)** | *"Adicione controle de acesso à versão 3.1 ... Use Firebase Authentication com login Google e Cloud Firestore ... Permita acesso somente aos UIDs cadastrados por um administrador..."* | Proteger dados na nuvem com Login Google e lista `authorized_users` | Provisionamento do Firebase, `src/firebase.ts`, `firestoreService.ts`, `AuthScreens.tsx`, `firebase-blueprint.json`, `firestore.rules` e migração opcional da v3.1. |
| **Auditoria e GitHub** | Solicitação de auditoria completa, documentação das cinco etapas acadêmicas e organização do repositório para publicação pública no GitHub | Garantir aderência entre código e documentação, segurança e clareza para avaliação | Correções pontuais de validação/feedback, revisão do `.gitignore` e criação de `README.md` + `docs/*`. |

### 2.2 Exemplo Representativo (Etapa Inicial Compactada)

Como o prompt literal de abertura da v1 foi compactado pela plataforma, o exemplo abaixo ilustra de forma **representativa** (não literal) a instrução inicial correspondente às respostas preservadas de esclarecimento:

> **Exemplo representativo (v1 inicial)**: *"Crie uma aplicação web acadêmica de RH chamada Sistema de Gestão de Colaboradores em React e TypeScript para cadastro de colaboradores, busca, filtros por setor e situação, edição em painel lateral, importação de CSV e início com lista vazia contendo opção para carregar dados de exemplo."*

---

## 3. Como os Resultados da IA Foram Revisados e Corrigidos

Todo código gerado ou ajustado com apoio da IA passou por revisão técnica e verificações concretas:

1. **Correção de efeitos colaterais em atualizadores de estado (React 19)**: Identificado e corrigido durante a evolução da v2 um padrão em que uma variável externa era alterada dentro do callback funcional de `setOnboardings(...)`; a derivação foi tornada determinística antes do envio.
2. **Correção de responsividade real em navegador**: A v3.1 corrigiu o estouro de largura (`499 px` em viewport de `390 px`) testando diretamente no Chromium headless em `320`, `390`, `430` e `1000 px`.
3. **Sincronismo entre validação de formulário/CSV e `firestore.rules`**: Na auditoria final, identificou-se que o parser CSV e a leitura local de v3.1 aceitavam nomes com 1 caractere, enquanto `firestore.rules` exige `>= 2`; a regra foi unificada em `employeeStorage.ts`, `csvParser.ts` e `EmployeeDrawer.tsx`.
4. **Alinhamento de `emailVerified` e feedback de erros**: Adicionada checagem explícita de `user.emailVerified` em `App.tsx` (antes de assinar coleções do Firestore) e diferenciação visual dos toasts de erro (`AlertCircle` em tom vermelho) que antes exibiam ícone verde de sucesso.
5. **Validação formal das regras de segurança**: Execução do linter oficial `@firebase/eslint-plugin-security-rules` (`npx eslint firestore.rules`) e verificação de ausência de segredos ou dados reais antes da publicação no GitHub.
