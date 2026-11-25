# Programação Assistida e Automação com IA

## Identificação
* **Nome:** Pedro Henrique Cunha Amancio da Silva
* **Instituição / Curso:** Centro Universitário UDF — Ciência da Computação
* **Disciplina:** Tendências em Ciência da Computação (Unidade II)
* **Data:** 25/11/2026
* **Ferramenta de IA utilizada:** Google Gemini

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
