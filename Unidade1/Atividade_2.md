# Aula 02 — Engenharia de Prompt
### Atividade Avaliativa A2 — Estudo de Caso em Relatórios de Status de Projeto

## 1. Identificação
- **Disciplina:** Tendências em Ciências da Computação
- **Unidade:** I — Fundamentos
- **Data:** 27/08/2026
- **Integrantes: Pedro Henrique Cunha Amancio da Silva (45729620)
- **Valor da atividade:** 0,5 ponto
- **Ferramenta de IA generativa utilizada:** Claude (Anthropic), modelo Claude Sonnet 5

## 2. Problema escolhido

### Contexto
A **TechFlow Soluções** é uma pequena consultoria de tecnologia com 4 pessoas na equipe,
que atende simultaneamente 3 clientes (Comércio Livre, Saúde+ e Instituto Vida). Toda
sexta-feira, o gerente de projetos recebe anotações soltas de reunião — misturando o
andamento dos três projetos, comentários financeiros internos e questões de pessoal — e
precisa transformar isso em relatórios diferentes: um para a diretoria da própria
TechFlow, e um para cada cliente externo. Esse processo consome cerca de 3 horas por
semana e, por não ser padronizado, já gerou pelo menos um incidente em que uma
informação financeira interna sobre um cliente apareceu, por engano, em uma comunicação
com outro cliente.

### Problema
A equipe precisa (1) transformar rapidamente as mesmas anotações brutas de reunião em
relatórios adequados a públicos diferentes (equipe interna, diretoria, cada cliente
externo) e (2) garantir que informações sensíveis ou de outros clientes nunca vazem
entre esses relatórios — sem contar com um processo manual de revisão longo.

### Objetivo
Utilizar IA generativa para (a) gerar múltiplas versões de relatório de status a partir
da mesma entrada bruta, adequadas a cada destinatário, e (b) validar que a segregação de
informações sensíveis entre clientes é respeitada de forma consistente.

> **Por que esse caso combina os dois casos de uso da atividade?**
> Resumir documentos técnicos e gerar relatórios adaptados a diferentes públicos não são
> tarefas isoladas aqui: a mesma anotação bruta alimenta relatórios distintos, e o maior
> risco não é a qualidade do texto, mas a **segregação correta da informação** entre
> destinatários. Por isso, o grupo tratou a geração de relatórios como um único fluxo de
> prompt com múltiplas saídas controladas.

## 3. Prompt inicial

```text
Resuma essa reunião em um relatório.
```

## 4. Resultado inicial

```text
Relatório da Reunião

- O checkout do Cliente A foi finalizado e está em teste.
- Há um bug no sistema do Cliente A em celulares Android antigos.
- Os protótipos de tela do Cliente B vão atrasar até terça.
- A reunião com o Cliente B foi remarcada para a próxima quinta.
- Ainda não liberaram o acesso ao servidor do Cliente C.
- A fatura do Cliente A ficou acima do orçado este mês.
- A documentação do Cliente B está 40% pronta.
- Camila vai sair de férias e precisa repassar as tarefas do Cliente C.
```

## 5. Análise crítica

- **O que funcionou:** a IA conseguiu organizar as anotações soltas em uma lista legível
  e não inventou nenhuma informação que não estivesse na entrada.
- **O que não funcionou:** o relatório mistura, num único texto, dados de três clientes
  diferentes — incluindo uma informação financeira interna sensível (fatura acima do
  orçado) que jamais poderia ser enviada a um cliente. Não há segregação por
  destinatário nem indicação de para quem o relatório se destina.
- **O que faltou:** definição de público-alvo, separação por cliente, filtro de
  informações sensíveis, priorização do que exige decisão.
- **O que precisa ser validado:** se este texto único fosse encaminhado sem revisão, um
  cliente poderia ver informações de outro cliente ou dados financeiros internos da
  TechFlow — um risco real de confidencialidade.

## 6. Prompt refinado

```text
PAPEL:
Você é um consultor de gestão de projetos especializado em atendimento a múltiplos
clientes simultâneos, com foco em comunicação segmentada e confidencialidade.

CONTEXTO:
A TechFlow Soluções atende três clientes ao mesmo tempo (Comércio Livre, Saúde+ e
Instituto Vida). As anotações abaixo vêm de uma reunião interna semanal e misturam
informações dos três projetos, além de comentários financeiros e de equipe que são
estritamente internos.

OBJETIVO:
Gerar, a partir da mesma entrada, três saídas distintas e seguras: um relatório interno
completo, um relatório específico para o Cliente A e uma mensagem executiva curta para a
diretoria da TechFlow.

TAREFA:
1. Relatório Interno: inclua todos os itens, organizados por cliente, para uso do
   gerente de projetos da TechFlow.
2. Relatório para o Cliente A (Comércio Livre): inclua apenas itens referentes a esse
   cliente.
3. Mensagem executiva para a diretoria: no máximo 5 linhas, apenas itens que exigem
   decisão de algum diretor.

RESTRIÇÕES:
- Nunca inclua, no relatório de um cliente, informações sobre outro cliente.
- Nunca inclua informações financeiras internas da TechFlow (custos, faturamento,
  margens) em relatórios destinados a clientes externos.
- Não inclua assuntos de pessoal interno (férias, transição de tarefas) em relatórios
  de clientes.
- Linguagem profissional e objetiva.

FORMATO:
Markdown, com um título claro indicando o destinatário de cada bloco de saída.

CRITÉRIOS DE QUALIDADE:
- Nenhuma informação de um cliente ou financeira interna pode vazar para o relatório de
  outro cliente.
- A mensagem executiva deve caber em 5 linhas e conter apenas itens acionáveis.

ANOTAÇÕES:
- Cliente A (Comércio Livre): checkout finalizado, aguardando testes do QA.
- Cliente B (Saúde+): protótipos de tela atrasados até terça-feira.
- Bug crítico no sistema do Cliente A, trava em Android antigos, em investigação.
- Reunião de alinhamento com o Cliente B remarcada para quinta-feira da próxima semana.
- Acesso ao servidor de homologação do Cliente C (Instituto Vida) ainda não liberado
  pelo TI do cliente.
- A fatura do Cliente A ficou acima do orçado este mês, precisa alinhar com o
  financeiro interno.
- Documentação técnica do módulo de notificações do Cliente B está 40% pronta.
- Camila vai sair de férias na próxima sexta e precisa repassar suas tarefas do
  Cliente C.
```

## 7. Resultado refinado

**Relatório Interno (uso do gerente de projetos da TechFlow)**

```markdown
### Cliente A — Comércio Livre
- Checkout finalizado, aguardando testes do QA.
- Bug crítico em investigação: trava em dispositivos Android antigos.
- Fatura do mês acima do orçado — alinhar com o financeiro interno.

### Cliente B — Saúde+
- Protótipos de tela atrasados até terça-feira.
- Reunião de alinhamento remarcada para quinta-feira da próxima semana.
- Documentação técnica do módulo de notificações 40% concluída.

### Cliente C — Instituto Vida
- Acesso ao servidor de homologação ainda não liberado pelo TI do cliente.
- Camila sai de férias na próxima sexta; tarefas precisam ser repassadas antes disso.
```

**Relatório para o Cliente A (Comércio Livre)**

```markdown
### Atualização de Status — Comércio Livre

- O desenvolvimento do checkout foi concluído e está em fase de testes de qualidade.
- Identificamos um ponto técnico relacionado a determinados dispositivos móveis mais
  antigos, atualmente em investigação pela equipe técnica.
```

**Mensagem executiva para a diretoria (máx. 5 linhas)**

```
🔴 Acesso ao servidor do Instituto Vida travado — pode exigir contato direto com o TI do cliente.
⚠️ Bug no sistema do Comércio Livre em investigação, risco de atraso.
💰 Fatura do Comércio Livre acima do orçado — validar com o financeiro.
👤 Camila sai de férias sexta; tarefas do Instituto Vida precisam de novo responsável antes disso.
```

## 8. Técnicas utilizadas

- [x] Role Prompting
- [x] Contexto
- [x] Restrições
- [x] Formato de saída
- [x] Prompt em etapas (múltiplas saídas a partir da mesma entrada)
- [x] Refinamento iterativo
- [ ] Few-Shot Prompting
- [ ] Outra

## 9. Comparação

| Critério | Prompt A (inicial) | Prompt B (refinado) |
|---|---|---|
| Clareza | Baixa | Alta |
| Contexto | Ausente | Completo |
| Relevância | Genérica, mistura tudo | Específica por destinatário |
| Organização | Fraca, texto único | Estruturada (3 saídas segregadas) |
| Precisão / Confidencialidade | Baixa — vaza dados entre clientes | Alta — segregação explícita respeitada |
| Utilidade | Precisa de reescrita manual completa | Pronto para envio direto a cada público |

**Qual prompt produziu o resultado mais adequado? Por quê?**
O Prompt B, pois incorporou o contexto de múltiplos clientes e restrições explícitas de
confidencialidade, eliminando o principal risco identificado na análise crítica: o
vazamento de informação entre clientes e dados financeiros internos.

## 10. Teste de robustez

Para observar o impacto de uma variável, o grupo removeu a restrição explícita "Nunca
inclua informações financeiras internas da TechFlow... em relatórios destinados a
clientes externos", mantendo o restante do prompt refinado igual, e pediu novamente
apenas o relatório para o Cliente A.

- **O que mudou na resposta:** sem a restrição explícita, o relatório para o Cliente A
  passou a incluir uma frase genérica sobre "ajustes internos de custo em andamento" —
  não revelou o valor exato da fatura, mas já introduziu um assunto que não deveria
  aparecer em uma comunicação externa.
- **Por que acreditamos que mudou:** sem a instrução explícita de exclusão, o modelo
  tratou a informação financeira como parte relevante do contexto do Cliente A e a
  incluiu de forma resumida, em vez de omiti-la por padrão.
- **A alteração melhorou ou piorou o resultado?** Piorou. O teste mostrou que **não se
  pode depender do bom senso implícito do modelo** para proteger informações sensíveis:
  restrições de confidencialidade precisam ser declaradas de forma explícita e
  específica no prompt, e não apenas inferidas do contexto.

## 11. Validação

O grupo validou o resultado da seguinte forma:

- Conferiu manualmente cada uma das três saídas, item por item, contra a entrada bruta,
  confirmando que nenhuma informação de outro cliente apareceu no relatório do Cliente A.
- Verificou que dados financeiros internos (fatura acima do orçado) e de pessoal
  (férias da Camila) não constavam em nenhuma saída externa.
- Confirmou que a mensagem executiva realmente continha apenas itens que exigem decisão
  de um diretor, e não itens operacionais já sendo resolvidos pela equipe.
- Tratou a repetição do teste de robustez (seção 10) como parte do processo de
  validação, já que revelou uma falha só perceptível ao remover uma restrição.

## 12. Ética e responsabilidade

- **Risco de vazamento entre clientes:** o maior risco ético/profissional identificado
  neste caso é a mistura de dados de clientes diferentes — algo que pode configurar
  quebra de confidencialidade contratual, não apenas um erro de redação.
- **Dependência de restrições explícitas:** o teste de robustez mostrou que o modelo
  não protege informações sensíveis por padrão; a responsabilidade de declarar essas
  restrições, e de revisar cada saída antes do envio, é do profissional.
- **Estimativas e priorizações não verificadas:** a classificação de itens como
  "urgente" ou "acionável" na mensagem executiva é uma sugestão do modelo, não um fato
  — cabe ao gerente de projetos confirmar essa priorização.
- **Dados pessoais de terceiros:** menções a colaboradores (ex: férias da Camila) que
  aparecem no relatório interno não devem circular externamente, o que reforça o
  cuidado necessário no manuseio de dados de equipe conforme a LGPD.

## 13. Take Away

**O que mudou na nossa compreensão sobre IA depois de aprender a estruturar um prompt?**
Percebemos que a estrutura do prompt não afeta apenas a qualidade do texto gerado, mas
pode ser a diferença entre um processo seguro e um incidente de confidencialidade. Um
prompt vago tende a tratar toda a informação disponível como igualmente relevante para
qualquer destinatário; um prompt bem estruturado, com restrições explícitas, segrega a
informação corretamente — mas isso não acontece por padrão, precisa ser pedido.

**Qual é a principal responsabilidade de uma pessoa que utiliza IA generativa para
produzir conhecimento ou tomar decisões?**
Assumir que o modelo não protege informações sensíveis por conta própria: cabe ao
profissional declarar explicitamente essas restrições e revisar cada saída antes de
enviá-la, especialmente quando envolve múltiplos públicos ou dados confidenciais de
terceiros. A responsabilidade por um eventual vazamento de informação continua sendo
integralmente humana, mesmo quando o texto foi redigido por uma IA.

## 14. Declaração de uso de Inteligência Artificial

Em conformidade com as boas práticas de transparência acadêmica, o grupo declara que
utilizou a ferramenta de IA generativa **Claude (Anthropic), modelo Claude Sonnet 5**,
como apoio na geração e no refinamento iterativo dos prompts e das respostas
apresentadas nas seções 3 a 7 e 10 deste documento. Todo o conteúdo gerado pela IA foi
lido, analisado criticamente e validado pelos integrantes do grupo antes de compor
este relatório, conforme descrito nas seções 11 (Validação) e 12 (Ética e
Responsabilidade).

## 15. Referências

ANTHROPIC. *Claude* (Sonnet 5). São Francisco: Anthropic, 2026. Disponível em:
https://claude.ai. Acesso em: 04 set. 2026.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023**: informação e documentação —
referências — elaboração. Rio de Janeiro: ABNT, 2018.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724**: informação e documentação —
trabalhos acadêmicos — apresentação. Rio de Janeiro: ABNT, 2011.

BRASIL. **Lei nº 13.709, de 14 de agosto de 2018**. Lei Geral de Proteção de Dados
Pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em:
https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em:
04 set. 2026.
