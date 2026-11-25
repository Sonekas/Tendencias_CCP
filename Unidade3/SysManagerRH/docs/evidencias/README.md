# Evidências e Capturas de Tela do Protótipo

Este diretório destina-se ao armazenamento das **capturas de tela reais** obtidas durante a execução e os testes do **Sistema de Gestão de Colaboradores**.

> **Status atual**: Nenhuma imagem foi gerada artificialmente. Os arquivos listados abaixo devem ser capturados pelo estudante/equipe no ambiente em execução (preview do AI Studio ou execução local) e salvos nesta pasta `docs/evidencias/` com os nomes padronizados da tabela.

---

## Lista Padronizada de Evidências Obrigatórias

| Nº | Nome de Arquivo Sugerido | Evidência | O que a imagem deve demonstrar claramente | Status |
|---|---|---|---|---|
| **01** | `01-tela-inicial-acesso.png` | **Tela inicial de acesso** | Aplicação aberta sem sessão ativa exibindo o cabeçalho azul-marinho, o título *Entrar no painel de RH* e o botão **Entrar com Google**, sem mostrar dados protegidos. | Pendente de captura |
| **02** | `02-tela-admissoes.png` | **Tela de admissões** | Aba principal **Admissões** com os 4 indicadores no topo, a linha do tempo dos próximos 7 dias, cartões com 3 segmentos (`Doc.`, `Acessos`, `Integr.`), destaque âmbar (`0–2d` / atrasos) e seção **A agendar**. | Pendente de captura |
| **03** | `03-checklist-admissao.png` | **Checklist de admissão** | Ficha lateral (ou tela cheia no mobile) aberta mostrando o nome do colaborador, a data prevista de início opcional, a barra de progresso (`0/3` a `3/3`) e as 3 etapas (*Validar documentação*, *Solicitar acesso aos sistemas*, *Agendar integração*) com status *Em andamento* ou *Concluída*. | Pendente de captura |
| **04** | `04-painel-indicadores.png` | **Painel de indicadores** | Aba **Visão geral** mostrando total de colaboradores, ativos, inativos, admissões em andamento/concluídas e a distribuição por setor (`RH`, `TI`, `Financeiro`, `Operações`). | Pendente de captura |
| **05** | `05-lista-colaboradores.png` | **Lista de colaboradores** | Aba **Colaboradores** com a barra de busca por nome, filtro de setor, filtro de situação (`Todas`, `Ativo`, `Inativo`), tabela de registros fictícios e status da admissão por pessoa. | Pendente de captura |
| **06** | `06-cadastro-e-edicao.png` | **Cadastro e edição** | Painel lateral (`EmployeeDrawer`) aberto exibindo os 4 campos obrigatórios, validação ou preenchimento com dados fictícios e a opção **Iniciar admissão** com data prevista opcional. | Pendente de captura |
| **07** | `07-importacao-csv.png` | **Importação CSV** | Modal **Importar CSV de colaboradores** após selecionar o arquivo modelo, mostrando os contadores de **Válidos**, **Duplicados** e **Inválidos** e a tabela de pré-visualização antes da confirmação. | Pendente de captura |
| **08** | `08-controle-de-acesso.png` | **Controle de acesso** | Tela **Acesso não autorizado** exibida para conta Google autenticada fora de `authorized_users` (mostrando o UID e o botão *Copiar UID*) **ou** composição lado a lado com o documento cadastrado em `authorized_users` no Console do Firebase. | Pendente de captura |
| **09** | `09-visualizacao-mobile.png` | **Visualização em dispositivo móvel** | Captura em largura de celular (ex.: `390 px` no DevTools) demonstrando o cabeçalho com o botão **Novo colaborador** completo sem cortes, as 3 abas visíveis e a linha do tempo empilhada verticalmente sem rolagem horizontal da página. | Pendente de captura |

---

## Como Inserir as Imagens Após Capturar

1. Salve cada captura com o nome exato da tabela dentro de `docs/evidencias/` (ex.: `docs/evidencias/01-tela-inicial-acesso.png`).
2. Recomenda-se utilizar apenas os dados fictícios do domínio `@empresa-modelo.com.br` nas capturas e evitar expor e-mails pessoais sensíveis se o repositório for público.
3. Após salvar os arquivos, atualize a coluna **Status** acima para **Capturado** e, se desejar exibi-las inline, adicione a sintaxe Markdown correspondente (ex.: `![Tela inicial de acesso](./01-tela-inicial-acesso.png)`).
