# Programação Assistida e Automação com IA

## Identificação
- **Nome:** Pedro Henrique Cunha Amancio da Silva
- **Instituição / Curso:** Centro Universitário UDF — Ciência da Computação
- **Disciplina:** Tendências em Ciência da Computação (Unidade II)
- **Ferramenta de IA utilizada:** Google Gemini

---

## 1. Problema
Em rotinas de suporte e operação de sistemas, arquivos e registros de log acumulam centenas de linhas de eventos (`INFO`, `WARNING`, `ERROR`), tornando a contagem manual demorada e sujeita a falhas humanas. O objetivo é automatizar a leitura e a contabilização dessas ocorrências para gerar um resumo rápido da saúde da operação.

## 2. Entrada
Uma lista de strings (representando linhas de um arquivo de log), onde cada linha inicia com o nível de severidade seguido pela mensagem do evento (ex.: `"ERROR conexão perdida"`).

## 3. Processamento
O programa percorre cada linha da lista de logs, identifica o prefixo de severidade (`INFO`, `WARNING` ou `ERROR`), ignora espaços extras ou diferenças de capitalização, contabiliza o total de cada categoria e registra eventuais linhas malformadas ou vazias.

## 4. Saída esperada
Um resumo estruturado exibindo a quantidade exata de ocorrências para `INFO`, `WARNING` e `ERROR`, além da indicação de linhas inválidas, caso existam.

## 5. Prompt utilizado
> **PAPEL:** Atue como um desenvolvedor Python sênior focado em automação de rotinas operacionais.  
> **CONTEXTO:** Preciso de um script simples para triagem rápida de registros de log de aplicação durante monitoramento de eventos.  
> **PROBLEMA:** Contar quantas ocorrências existem dos níveis `INFO`, `WARNING` e `ERROR` em uma lista de logs textual.  
> **ENTRADA:** Uma lista de strings em Python, onde cada item representa uma linha de log (ex.: `"INFO usuário autenticado"`).  
> **SAÍDA ESPERADA:** Um dicionário com a contagem de cada nível e a exibição organizada do resumo no terminal.  
> **LINGUAGEM:** Python 3.  
> **RESTRIÇÕES:** Utilizar apenas a biblioteca padrão do Python; não ler ou modificar arquivos externos nesta primeira versão; manter o código simples e legível.  
> **CRITÉRIOS DE QUALIDADE:** Código claro, com nomes de variáveis descritivos e exemplo de execução.  
> **CASOS DE TESTE:** Deve funcionar com a lista padrão de logs mistos e também lidar com listas vazias.

## 6. Código inicial
```python
def contar_logs(linhas_log):
    contagem = {"INFO": 0, "WARNING": 0, "ERROR": 0}
    for linha in linhas_log:
        partes = linha.split(" ", 1)
        nivel = partes[0].upper()
        if nivel in contagem:
            contagem[nivel] += 1
    return contagem


logs = [
    "INFO usuário autenticado",
    "ERROR conexão perdida",
    "INFO arquivo salvo",
    "WARNING espaço reduzido",
    "ERROR banco indisponível",
]

resultado = contar_logs(logs)
for nivel, total in resultado.items():
    print(f"{nivel}: {total}")
```

## 7. Análise crítica
- **Compreensão do código:** O código é direto, usa um laço `for` simples e o método `split(" ", 1)` para separar o nível da mensagem.
- **Atendimento ao problema:** Resolve o cenário básico proposto na Opção C.
- **Bibliotecas desconhecidas:** Nenhuma; utiliza apenas recursos nativos do Python.
- **Risco de perda de dados:** Nenhum, pois opera apenas em memória sem escrita em disco.
- **Dados sensíveis:** Não utiliza credenciais, tokens ou dados reais de produção.
- **Tratamento de erros e casos não considerados:** Se a lista receber `None` ou um tipo inválido (como um número inteiro), o programa lança `AttributeError` ou `TypeError` sem tratamento. Além disso, linhas vazias (`""`), linhas com espaços no início (`"  ERROR falha"`) ou níveis desconhecidos (ex.: `"CRITICAL falha geral"`) são ignorados silenciosamente sem alertar o operador.

## 8. Casos de teste

### Teste 1 — Caso normal (Entrada válida)
- **Entrada:** `["INFO usuário autenticado", "ERROR conexão perdida", "INFO arquivo salvo", "WARNING espaço reduzido", "ERROR banco indisponível"]`
- **Resultado esperado:** `INFO: 2`, `WARNING: 1`, `ERROR: 2`
- **Resultado obtido:** Passou. Exibiu exatamente as contagens esperadas.

### Teste 2 — Caso limite (Lista vazia e espaços extras)
- **Entrada:** `["", "   ", "  error falha com espaço  "]`
- **Comportamento esperado:** Não quebrar a execução, retornar `0` para os níveis ausentes e contabilizar `"ERROR: 1"` ignorando os espaços iniciais.
- **Resultado obtido:** Falhou parcialmente. Não quebrou, mas retornou `ERROR: 0` porque `linha.split(" ", 1)` pegou `""` antes do espaço inicial em vez de fazer `.strip()`.

### Teste 3 — Caso de erro (Entrada inválida / tipo incorreto)
- **Entrada:** `None` (ou `[123, "INFO ok"]`)
- **Tratamento esperado:** Lançar uma mensagem clara de erro de validação (`TypeError`) indicando que a entrada deve ser uma lista de strings.
- **Resultado obtido:** Falhou com exceção não tratada (`TypeError: 'NoneType' object is not iterable` e `AttributeError: 'int' object has no attribute 'split'`).

## 9. Problemas encontrados
1. Falta de sanitização de espaços em branco nas extremidades das linhas (`strip()`), fazendo com que logs indentados não fossem contabilizados.
2. Ausência de rastreamento de linhas malformadas ou níveis não reconhecidos (`INVALIDO`), mascarando possíveis falhas no formato do log.
3. Ausência de validação de tipo da entrada, *type hints* e *docstrings* para facilitar a manutenção.

## 10. Prompt de refatoração
> Revise o código Python abaixo. O programa já funciona para o caso básico, mas falhou em casos limite com espaços em branco e entradas inválidas.  
> Agora analise e refatore considerando:  
> - clareza e legibilidade (incluindo *type hints* e *docstring*);  
> - organização e separação de responsabilidades (cálculo vs. exibição);  
> - tratamento de erros (validar se a entrada é uma coleção de strings e tratar linhas vazias ou níveis desconhecidos sem quebrar);  
> - sanitização de espaços extras com `.strip()`.  
> Não altere o comportamento esperado para logs válidos e explique cada melhoria realizada.

## 11. Código refatorado
```python
from collections.abc import Iterable

NIVEIS_VALIDOS = ("INFO", "WARNING", "ERROR")


def analisar_logs(linhas_log: Iterable[str]) -> dict[str, int]:
    """Contabiliza ocorrências de níveis de log (INFO, WARNING, ERROR).

    Args:
        linhas_log: Iterável contendo strings de registros de log.

    Returns:
        Dicionário com a contagem de cada nível válido e de linhas inválidas.

    Raises:
        TypeError: Se linhas_log não for um iterável válido ou contiver itens não textuais.
    """
    if isinstance(linhas_log, (str, bytes)) or not isinstance(linhas_log, Iterable):
        raise TypeError("A entrada 'linhas_log' deve ser uma lista ou iterável de strings.")

    contagem = {nivel: 0 for nivel in NIVEIS_VALIDOS}
    contagem["INVALIDO"] = 0

    for linha in linhas_log:
        if not isinstance(linha, str):
            raise TypeError(
                f"Item inválido encontrado no log: esperado str, recebido {type(linha).__name__}."
            )

        linha_limpa = linha.strip()
        if not linha_limpa:
            contagem["INVALIDO"] += 1
            continue

        nivel = linha_limpa.split(maxsplit=1)[0].upper()
        if nivel in contagem:
            contagem[nivel] += 1
        else:
            contagem["INVALIDO"] += 1

    return contagem


def exibir_relatorio(contagem: dict[str, int]) -> None:
    """Exibe o resumo formatado da análise de logs no terminal."""
    print("=== Resumo da Análise de Logs ===")
    for nivel in NIVEIS_VALIDOS:
        print(f"{nivel:<8}: {contagem.get(nivel, 0)}")
    if contagem.get("INVALIDO", 0) > 0:
        print(f"INVALIDO: {contagem['INVALIDO']} (linhas vazias ou fora do padrão)")


if __name__ == "__main__":
    logs_exemplo = [
        "INFO usuário autenticado",
        "ERROR conexão perdida",
        "  info arquivo salvo  ",
        "WARNING espaço reduzido",
        "ERROR banco indisponível",
        "",
    ]
    resultado = analisar_logs(logs_exemplo)
    exibir_relatorio(resultado)
```

## 12. Comparação

| Critério | Inicial | Refatorado |
| :--- | :---: | :---: |
| Funcionamento correto | 4 | 5 |
| Clareza | 4 | 5 |
| Organização | 3 | 5 |
| Legibilidade | 4 | 5 |
| Tratamento de erros | 1 | 5 |
| Facilidade de manutenção | 3 | 5 |

## 13. Reflexão
- **Onde a IA mais ajudou?** Na estruturação rápida da versão inicial e na refatoração para aplicar boas práticas do Python (como *type hints*, separação entre lógica de negócio e exibição e uso de `split(maxsplit=1)`).
- **Onde a IA errou?** Na primeira geração, a IA assumiu apenas o "caminho feliz", ignorando linhas com espaços antes do nível de log e omitindo validações de tipo ou registros fora do padrão.
- **O que precisei modificar?** Direcionei a refatoração após os testes de borda falharem, exigindo a sanitização com `.strip()`, a contagem explícita de linhas `INVALIDO` e o levantamento de `TypeError` para entradas incorretas.
- **Consigo explicar o código?** Sim. Cada bloco está isolado em funções pequenas com responsabilidade única, facilitando a defesa técnica e a manutenção futura.

## 14. Take Away
Programar com IA não significa deixar a IA programar por mim. Significa atuar como engenheiro e revisor crítico, definindo requisitos claros, validando casos extremos e assumindo total responsabilidade pelo código colocado em produção.

**Cinco regras para utilizar IA de maneira responsável:**
1. **Nunca aceite código sem ler e testar:** Valide tanto o fluxo normal quanto os casos limite e de erro antes de integrar ao projeto.
2. **Proteja dados sensíveis:** Jamais cole senhas, chaves de API, tokens ou dados confidenciais em prompts.
3. **Desenvolva de forma incremental:** Divida problemas complexos em etapas pequenas e bem especificadas para reduzir alucinações.
4. **Mantenha o domínio técnico:** Só utilize em produção trechos que você compreende e consegue depurar manualmente se falharem.
5. **Assuma a autoria do *commit*:** A IA é uma ferramenta assistiva; a responsabilidade ética, legal e técnica pelo software é sempre do desenvolvedor.
