# Atividade - Refinamento de Prompts

## Identificação
- **Nome:** Pedro Henrique Cunha Amancio da Silva (45729620)
- **Data:** 03/09/2026
- **Ferramenta de IA utilizada:** Claude (Anthropic), modelo Claude Sonnet 5

---

## Problema escolhido

### Contexto
Em disciplinas de Introdução à Programação, é comum que revisões de código entre colegas se
limitem a verificar se o programa "funciona", sem observar problemas de qualidade, más
práticas ou erros que só aparecem em certas condições (como listas vazias). Um estudante quer
usar IA generativa para treinar a habilidade de revisar código de forma mais crítica e
didática, usando como exemplo uma função Python real com problemas ocultos.

### Problema
Como formular prompts que levem a IA a ir além de um "está funcionando, parabéns" e realmente
identificar problemas de qualidade, legibilidade e bugs latentes em um trecho de código,
explicando cada um de forma que sirva de aprendizado?

### Objetivo
Obter, com apoio de IA generativa, uma revisão de código estruturada, didática e priorizada
por severidade, que sirva tanto para corrigir o código quanto para o estudante aprender os
conceitos por trás de cada problema apontado.

**Código utilizado em todos os testes:**

```python
def calcula_media(lista=[]):
    soma = 0
    for i in range(len(lista)):
        soma = soma + lista[i]
    media = soma / len(lista)
    return media
```

---

## Prompt 1

### Prompt
```text
Revise este código Python:

def calcula_media(lista=[]):
    soma = 0
    for i in range(len(lista)):
        soma = soma + lista[i]
    media = soma / len(lista)
    return media
```

### Resultado
```text
O código está correto e calcula a média dos elementos de uma lista. Ele soma todos os
valores usando um laço for e depois divide pelo total de elementos. Está funcional e claro.
Se quiser, posso ajudar a otimizar ainda mais o código.
```

### Análise
- **O que funcionou:** a IA leu o código e descreveu corretamente o que ele faz.
- **O que faltou:** nenhuma menção ao bug clássico de argumento mutável (`lista=[]`), que pode
  causar comportamento inesperado em chamadas sucessivas da função; nenhuma menção ao erro de
  `ZeroDivisionError` caso a lista esteja vazia; nenhuma sugestão sobre usar `sum()` no lugar
  do laço manual, nem sobre ausência de docstring ou type hints.
- **O que ficou genérico:** a resposta trata o código como "correto", quando na verdade tem
  pelo menos dois problemas reais que podem gerar bugs silenciosos em produção.
- **O que poderia ser melhor:** faltou um papel definido para a IA (revisor experiente), um
  objetivo claro (encontrar problemas, não apenas descrever o código) e um formato de saída
  que organizasse os achados.

---

## Prompt 2

### Alterações realizadas
- **Papel:** adicionado — revisor de código sênior.
- **Contexto:** adicionado — quem vai usar o código (estudante iniciante).
- **Objetivo:** redefinido — encontrar problemas reais, não apenas descrever o funcionamento.
- **Público:** adicionado — feedback deve ser didático, explicando cada termo técnico.
- **Formato:** adicionado — lista de problemas encontrados, cada um com explicação.
- **Restrições:** adicionado — não reescrever o código inteiro, apenas apontar os problemas.
- **Critérios:** ainda não definidos (será adicionado no Prompt 3).

### Prompt
```text
Atue como um revisor de código Python sênior, especializado em ajudar estudantes
iniciantes a melhorarem a qualidade do próprio código.

CONTEXTO:
O código abaixo foi escrito por um estudante do primeiro ano de Ciência da Computação
para uma disciplina de Introdução à Programação.

OBJETIVO:
Identificar problemas reais no código — incluindo bugs que só aparecem em certas
condições, não apenas erros de sintaxe — e explicar cada um de forma didática.

TAREFA:
Liste os problemas encontrados no código. Para cada um, explique o que é o problema e
por que ele é um problema.

FORMATO:
Lista numerada, um problema por item.

RESTRIÇÕES:
Não reescreva o código inteiro. Aponte apenas os problemas e explique-os.

CÓDIGO:
def calcula_media(lista=[]):
    soma = 0
    for i in range(len(lista)):
        soma = soma + lista[i]
    media = soma / len(lista)
    return media
```

### Resultado
```text
1. Argumento padrão mutável (lista=[]): em Python, valores padrão de função são criados
   uma única vez, na definição da função. Se a lista for modificada dentro da função em
   chamadas futuras sem passar um argumento, o valor padrão pode "vazar" entre chamadas
   diferentes, causando bugs difíceis de rastrear.

2. Divisão por zero não tratada: se `lista` estiver vazia, `len(lista)` será 0 e a linha
   `media = soma / len(lista)` lançará um ZeroDivisionError. Não há tratamento para esse
   caso.

3. Uso de índice desnecessário: o laço `for i in range(len(lista))` é mais complexo do
   que o necessário. Em Python, é mais idiomático iterar diretamente sobre os elementos
   com `for valor in lista`, ou usar a função embutida `sum(lista)`.

4. Ausência de docstring: a função não explica o que faz, quais parâmetros espera nem o
   que retorna, dificultando o entendimento por outras pessoas.

5. Ausência de type hints: não há indicação dos tipos esperados (ex: lista de números),
   o que reduz a clareza do contrato da função.
```

---

## Comparação

| Critério | Prompt 1 | Prompt 2 |
|---|---:|---:|
| Clareza | 2 | 4 |
| Precisão | 1 | 5 |
| Relevância | 2 | 5 |
| Organização | 2 | 4 |
| Adequação ao público | 2 | 4 |
| Atendimento ao objetivo | 1 | 5 |
| Utilidade prática | 1 | 4 |

### Escala
| Nota | Interpretação |
|---:|---|
| 1 | Muito insatisfatório |
| 2 | Insatisfatório |
| 3 | Adequado |
| 4 | Muito bom |
| 5 | Excelente |

---

## Prompt 3

### O que ainda precisava melhorar?
O Prompt 2 identificou corretamente os problemas, mas apresentou todos no mesmo nível de
importância — sem indicar qual é mais grave (o argumento mutável é um bug real; a ausência
de type hints é apenas uma boa prática). Também não entregou uma versão corrigida do código,
que seria útil para o estudante comparar com o original.

### Hipótese de melhoria
Acredito que a resposta ficará melhor porque adicionar um critério de priorização por
severidade e pedir uma versão corrigida (com explicação de cada mudança) vai transformar a
revisão em material de estudo completo, e não apenas em uma lista de observações soltas.

### Prompt
```text
Atue como um revisor de código Python sênior, especializado em ajudar estudantes
iniciantes a melhorarem a qualidade do próprio código.

CONTEXTO:
O código abaixo foi escrito por um estudante do primeiro ano de Ciência da Computação
para uma disciplina de Introdução à Programação. Ele ainda não estudou tratamento de
exceções nem boas práticas avançadas de Python.

OBJETIVO:
Identificar problemas reais no código, priorizá-los por severidade e ajudar o estudante
a entender por que cada mudança é necessária — não apenas entregar um código corrigido
sem explicação.

TAREFA:
1. Liste os problemas encontrados no código.
2. Para cada problema, classifique a severidade (Crítico / Moderado / Boa prática).
3. Explique o problema em linguagem acessível, definindo qualquer termo técnico usado.
4. Ao final, apresente uma versão corrigida do código.

FORMATO:
Tabela com as colunas: Problema | Severidade | Explicação | Sugestão de correção.
Seguida da versão corrigida do código em um bloco separado.

RESTRIÇÕES:
- Não altere o nome da função nem seu comportamento esperado (calcular a média).
- Explique qualquer termo técnico utilizado (ex: "argumento mutável").

CRITÉRIO DE QUALIDADE:
Ao final, o estudante deve conseguir explicar, com suas próprias palavras, por que cada
mudança sugerida é necessária.

CÓDIGO:
def calcula_media(lista=[]):
    soma = 0
    for i in range(len(lista)):
        soma = soma + lista[i]
    media = soma / len(lista)
    return media
```

### Resultado
```text
| Problema | Severidade | Explicação | Sugestão de correção |
|---|---|---|---|
| Argumento padrão mutável (lista=[]) | Crítico | Valores padrão em Python são criados uma única vez, na definição da função, e não a cada chamada. Se esse valor for uma lista e for alterado, essa alteração persiste entre chamadas futuras, gerando bugs difíceis de encontrar. | Usar `None` como padrão e criar a lista dentro da função, se necessário. |
| Divisão por zero não tratada | Crítico | Se a lista estiver vazia, `len(lista)` é 0, e dividir por zero gera um erro (ZeroDivisionError) que interrompe o programa. | Verificar se a lista está vazia antes de dividir, lançando um erro claro ou retornando um valor padrão. |
| Uso de índice desnecessário | Moderado | Percorrer a lista por posição (índice) é mais complexo do que necessário quando não se precisa da posição, apenas do valor. | Iterar diretamente sobre os valores ou usar a função embutida `sum()`. |
| Ausência de docstring | Boa prática | Uma docstring é um texto de documentação dentro da função, explicando o que ela faz. Sem isso, outras pessoas (ou você mesmo, no futuro) têm mais dificuldade de entender a função sem ler todo o código. | Adicionar uma docstring descrevendo parâmetro, retorno e comportamento em caso de lista vazia. |
| Ausência de type hints | Boa prática | Type hints são anotações que indicam o tipo esperado de um parâmetro ou retorno (ex: lista de números). Ajudam ferramentas e outras pessoas a entenderem o contrato da função sem executá-la. | Anotar o parâmetro como `list[float]` e o retorno como `float`. |

Versão corrigida:

def calcula_media(lista: list[float] | None = None) -> float:
    """Calcula a média aritmética de uma lista de números.

    Levanta ValueError se a lista for vazia ou não for fornecida.
    """
    if not lista:
        raise ValueError("A lista não pode ser vazia.")
    return sum(lista) / len(lista)
```

---

## Comparação final

| Critério | Prompt 1 | Prompt 2 | Prompt 3 |
|---|---:|---:|---:|
| Clareza | 2 | 4 | 5 |
| Precisão | 1 | 5 | 5 |
| Relevância | 2 | 5 | 5 |
| Organização | 2 | 4 | 5 |
| Adequação ao público | 2 | 4 | 5 |
| Atendimento ao objetivo | 1 | 5 | 5 |
| Utilidade prática | 1 | 4 | 5 |
| **Total** | **11** | **31** | **35** |

**Qual modificação teve maior impacto no resultado?**
A maior mudança de qualidade ocorreu entre o Prompt 1 e o Prompt 2, ao definir papel,
objetivo explícito de "encontrar problemas reais" e formato de saída — isso foi o que fez a
IA parar de simplesmente descrever o código e passar a revisá-lo criticamente. Já a mudança
do Prompt 2 para o Prompt 3 (priorização por severidade + código corrigido) teve impacto
menor em quantidade de problemas identificados, mas maior em **utilidade prática**, pois
transformou a lista de observações em material pronto para estudo e correção.

---

## Validação

Como você verificou a qualidade e correção da resposta?

- Confirmei manualmente, consultando a documentação oficial do Python, que argumentos
  padrão mutáveis realmente são avaliados uma única vez na definição da função — o
  comportamento apontado pela IA é um problema real e amplamente documentado, não uma
  alucinação.
- Testei mentalmente (e poderia executar) a função original com uma lista vazia para
  confirmar que o `ZeroDivisionError` de fato ocorre, validando o segundo problema apontado.
- Verifiquei que a versão corrigida sugerida no Prompt 3 preserva o comportamento esperado
  da função original (calcular a média) e resolve os dois problemas críticos identificados.
- Não aceitei a afirmação do Prompt 1 ("o código está correto") sem verificação — foi
  justamente essa verificação que revelou a limitação da primeira resposta.

---

## Reflexão

### 1. Qual foi a principal diferença entre os prompts?
O Prompt 1 pediu apenas uma "revisão" genérica e recebeu uma descrição do código. O Prompt 2
definiu papel, objetivo explícito (achar problemas reais) e formato, e por isso recebeu uma
lista de bugs reais. O Prompt 3 acrescentou priorização por severidade e pediu uma versão
corrigida, entregando um material completo de estudo.

### 2. Quais elementos tiveram maior impacto?
O objetivo explícito ("identificar problemas reais, incluindo bugs que só aparecem em certas
condições") foi o elemento de maior impacto — sem ele, a IA tratou "o código funciona" como
sinônimo de "o código está correto".

### 3. Um prompt maior é necessariamente melhor?
Não. O Prompt 2 é bem mais longo que o Prompt 1, mas o ganho de qualidade não veio do
tamanho, e sim de informações específicas (papel, objetivo, formato). Um prompt longo cheio
de adjetivos vagos ("revise muito bem, de forma completa e detalhada") teria o mesmo problema
do Prompt 1: falta de direção concreta.

### 4. O que ocorre quando o objetivo não é claro?
A IA tende a responder ao pedido mais superficial possível — no caso, apenas confirmar que o
código "funciona", em vez de investigar problemas latentes. Sem um objetivo claro, o modelo
não tem como saber o nível de profundidade esperado.

### 5. Quais informações são indispensáveis?
Papel (quem está revisando), objetivo específico (o que conta como "problema"), formato de
saída e, neste caso, uma restrição sobre não reescrever tudo sem explicar — que evitou que a
IA simplesmente entregasse um código novo sem ensinar nada.

### 6. Como essa habilidade pode ser utilizada profissionalmente?
Um profissional de Ciência da Computação pode usar esse tipo de prompt estruturado para
revisões de código mais consistentes, para preparar materiais de treinamento de novos
membros da equipe, ou para criar checklists de qualidade antes de um code review humano —
sempre com a ressalva de que a IA apoia, mas não substitui a revisão final de uma pessoa.

### 7. Quais riscos existem ao confiar automaticamente na IA?
O Prompt 1 já mostra o risco central: a IA pode dar uma resposta coerente e convincente
("o código está correto") que está objetivamente errada. Se essa resposta fosse aceita sem
verificação, um bug real (o argumento mutável) passaria despercebido e poderia causar falhas
difíceis de depurar em produção.

---

## Take Away

> Um bom prompt não é simplesmente um prompt longo. Ele precisa **fornecer as informações
> certas — papel, objetivo, contexto, formato e restrições — para reduzir a ambiguidade e
> orientar a IA para o resultado que realmente importa, e mesmo assim a resposta precisa ser
> verificada antes de ser usada.**

---

## Cinco recomendações

1. Defina um objetivo específico em vez de pedir uma tarefa genérica — troque "revise meu
   código" por "encontre bugs que só aparecem em certas condições".
2. Diga à IA qual papel ela deve assumir e para qual público a resposta se destina.
3. Peça um formato de saída que facilite a verificação (listas, tabelas, severidade), em vez
   de um texto corrido.
4. Não meça a qualidade de um prompt pelo número de palavras — meça pela quantidade de
   ambiguidade que ele elimina.
5. Trate toda resposta gerada por IA como uma hipótese a ser verificada, não como uma
   conclusão pronta — especialmente quando ela soa segura demais.
