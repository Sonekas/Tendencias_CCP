# ARCHITECTURE - GradeBot

## 1. Visão Arquitetural
O **GradeBot** é um Agente Conversacional Autônomo orientado a regras e metas, desenhado para resolver o problema de montagem de grade horária acadêmica, validação rigorosa de pré-requisitos e mitigação ativa de sobrecarga estudantil. O sistema opera **100% offline e local**, sem requisições para LLMs em nuvem.

```mermaid
graph TD
    User([Usuário / Estudante]) -->|Mensagem em Linguagem Natural| L1[1. Camada Perceptiva]
    
    subgraph "Motor do Agente (4 Camadas Autônomas)"
        L1 -->|Filtro LGPD / Sanitização| L2[2. Camada Cognitiva]
        L1 -.->|Se CPF/RG/Senha detectado| Block[Bloqueio Preventivo LGPD & Alerta]
        
        L2 -->|Intenção & Entidades Identificadas| L3[3. Camada Decisória]
        
        L3 -->|Consulta Regras & Horários| Cat[(catalogo_udf.json)]
        L3 -->|Consulta Histórico Acadêmico| MemLonga[(memoria_aluno.json)]
        L3 -->|Regra de Equidade Trabalhador| BiasOpt[Mitigador de Sobrecarga / Viés]
        
        L3 -->|Plano de Ação Aprovado| L4[4. Camada Executiva]
    end

    subgraph "Gestão de Memória em 3 Níveis"
        MemCurta[Memória Curta: Histórico do Chat Atual]
        MemMedia[Memória Média: Simulações da Sessão]
        MemLonga
    end

    L4 -->|Renderização Visual Transparente| UI[Interface Streamlit 60FPS]
    L4 -->|Exportação de Arquivo| MDFile[grade_sugerida.md]
    L4 -->|Atualização de Estado| MemCurta
    L4 -->|Armazenamento de Simulações| MemMedia
    L4 -->|Persistência em Disco| MemLonga
```

## 2. As 4 Camadas do Agente
1. **Camada Perceptiva (`PerceptiveLayer`)**:
   - Sanitização de entrada.
   - Privacy by Design: Expressões regulares avançadas que detectam CPF (formatado e dígitos puros), RG e senhas antes de qualquer processamento ou log.
2. **Camada Cognitiva (`CognitiveLayer`)**:
   - Reconhecimento de intenções: `MONTAR_GRADE`, `CONCLUIR_DISCIPLINA`, `CONSULTAR_PREREQUISITO`, `VER_HISTORICO`, `AUDITAR_ETICA`, `LISTAR_CATALOGO`, `LIMPAR_MEMORIA`, `AJUDA`.
   - Extração de códigos de disciplinas e parâmetros contextuais.
3. **Camada Decisória (`DecisionalLayer`)**:
   - Grafo de pré-requisitos direcionado.
   - Matriz de compatibilidade temporal (Dia da semana x Turno).
   - Mecanismo de Equidade: Limite de disciplinas de carga "Alta" para estudantes trabalhadores.
4. **Camada Executiva (`ExecutiveLayer`)**:
   - Construção da resposta com feedback visual (Markdown, status e badges).
   - Disparo de efeitos colaterais (escrita em `memoria_aluno.json` e geração de `grade_sugerida.md`).

## 3. Gestão de Memória
- **Curta:** Gerenciada no `st.session_state.messages` com limitação de contexto.
- **Média:** Armazena cenários simulados na sessão (`st.session_state.simulacoes_sessao`).
- **Longa:** Persistida no arquivo local `memoria_aluno.json` com histórico de aprovações.
