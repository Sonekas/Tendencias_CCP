# TASKS - GradeBot (Agente Conversacional Autônomo)

Checklist de desenvolvimento e acompanhamento do ciclo de vida:

- [x] Planejamento de Requisitos e Definição de Pronto (Definition of Done)
- [x] Estruturação do repositório em `gradebot-udf`
- [x] Criação da base de conhecimento `catalogo_udf.json` com 10 disciplinas realistas de Ciência da Computação UDF
- [x] Criação da identidade visual acadêmica em `.streamlit/config.toml` (Cores UDF: #004A8D, #0072CE, #F8FAFC)
- [x] Implementação do motor do Agente (`agent.py`) com as 4 Camadas de IA:
  - [x] Camada Perceptiva (Filtro LGPD Privacy by Design para CPF, RG e senhas)
  - [x] Camada Cognitiva (Classificador semântico de intenções e extração de entidades)
  - [x] Camada Decisória (Validação de pré-requisitos, choque de horários e equidade de carga)
  - [x] Camada Executiva (Geração de resposta, persistência em `memoria_aluno.json` e exportação de `grade_sugerida.md`)
- [x] Implementação da interface conversacional Streamlit (`app.py`):
  - [x] Chat interativo (`st.chat_message`, `st.chat_input`)
  - [x] Inspeção visual das 4 camadas com `st.status`
  - [x] Barra lateral (`st.sidebar`) com os 3 níveis de memória (Curta, Média e Longa)
  - [x] Botão de download da grade em Markdown (`st.download_button`)
  - [x] Toggle de mitigação de viés (Estudante Trabalhador)
- [x] Criação da suíte de testes unitários automatizados com Pytest (`tests/test_agent.py`)
- [x] Execução e validação dos testes no terminal (13 de 13 testes aprovados com exit code 0)
- [x] Elaboração do `README.md` acadêmico completo com as 5 seções curriculares da UDF
