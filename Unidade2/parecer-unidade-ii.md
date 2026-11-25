# Parecer Individual — Unidade II: Programação Assistida por IA

## Identificação
- **Nome:** Pedro Henrique Cunha Amancio da Silva
- **Instituição / Curso:** Centro Universitário UDF — Ciência da Computação
- **Disciplina:** Tendências em Ciência da Computação (Unidade II)
- **Ferramenta de IA utilizada:** Google Gemini

---

## 1. Contextualização e Paradigma Humano-IA
A adoção de assistentes baseados em Modelos de Linguagem (LLMs) — como GitHub Copilot, Replit Ghostwriter e ambientes agênticos como Cursor — consolidou um novo modelo de programação por pares (*Dev + IA*). Nesse fluxo, a inteligência artificial atua como aceleradora da escrita de sintaxe e geração de *boilerplate*, enquanto o desenvolvedor humano assume o papel de arquiteto, navegador e revisor crítico das decisões técnicas.

## 2. Aplicação Prática: Sugestões, Refatoração e Automação
Na prática de laboratório e em rotinas reais de suporte e operação de TI, o uso sustentável da IA depende da qualidade da especificação fornecida no prompt (definindo papel, contexto, entrada, saída esperada e restrições) e de um ciclo iterativo de validação:
- **Geração e Automação:** Ferramentas assistivas reduzem o esforço mecânico na criação de scripts utilitários (como parsers de logs e consultas a APIs), permitindo validar protótipos rapidamente.
- **Refatoração e Qualidade:** A IA eleva a legibilidade e a eficiência algorítmica quando orientada a aplicar boas práticas da linguagem (modularização, *type hints*, tratamento de exceções e redução de complexidade).
- **Depuração Híbrida:** Conforme observado no estudo empírico de Sarkar e Drosos (2025) sobre *vibe coding*, a depuração mais eficaz combina o diagnóstico humano (leitura de logs, console e inspeção de *diffs*) com prompts direcionados para corrigir causas-raiz específicas.

## 3. Limites da IA, Confiança Calibrada e Estudo de Caso
O estudo sobre *vibe coding* demonstra que o desengajamento material em relação ao código não elimina a necessidade de conhecimento técnico; pelo contrário, redistribui a expertise para a gestão de contexto e avaliação rápida de estrutura. Aceitar sugestões sem revisão (*Accept All* cego) expõe projetos ao chamado *context momentum* negativo, dívida técnica, alucinação de APIs ou bibliotecas inexistentes e falhas em casos extremos (*edge cases*).

No estudo de caso analisado em aula — em que uma funcionalidade gerada por IA passa em um teste inicial, mas não teve revisão detalhada —, a integração imediata ao repositório representa um risco operacional grave. Antes do *merge*, a equipe deve auditar dependências, sanitizar entradas, executar testes de falha e garantir que o código não quebre módulos existentes.

## 4. Segurança, Ética e Responsabilidade Técnica
Assistentes de IA não possuem consciência de segurança, privacidade ou conformidade legal. Entre os principais riscos estão a introdução de vulnerabilidades (como injeção de SQL e exposição de credenciais), o vazamento de dados confidenciais em prompts e a violação de licenças de software. Portanto, a responsabilidade ética, técnica e legal pelo *commit* permanece integralmente humana.

## 5. Síntese Final
Programar com IA de maneira responsável não significa apenas saber pedir código; significa também assumir o papel de arquiteto, revisor crítico e guardião da qualidade do software. Exige compreender o problema antes de formular o prompt, validar cada sugestão com testes rigorosos e jamais delegar à máquina decisões de segurança, arquitetura ou regras de negócio. A IA acelera a escrita, mas a compreensão técnica e a responsabilidade final pelo código entregue permanecem estritamente humanas.

## 6. Transparência (Fontes e Ferramenta de IA)
- **Fontes de pesquisa e base teórica:**
  - SARKAR, Advait; DROSOS, Ian. *Vibe coding: programming through conversation with artificial intelligence*. Proceedings of the 36th Annual Conference of the Psychology of Programming Interest Group (PPIG), 2025.
  - VALÉRIA, Kadidja. *Guia de Boas Práticas na Colaboração Humano-IA* e *Material do Estudante: Programação Assistida e Automação com Inteligência Artificial* (Tendências em Ciência da Computação — Unidade II, Centro Universitário UDF, 2026).
  - Podcast da Unidade II — Tendências em Ciência da Computação (UDF).
- **Ferramenta de IA utilizada como apoio:** Google Gemini (utilizado na revisão estrutural do texto, geração inicial e refatoração dos scripts em Python da atividade prática).
