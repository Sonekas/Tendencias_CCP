"""
GradeBot - Interface Streamlit do Agente Conversacional Autônomo
Auxílio na montagem de grade semestral, validação de pré-requisitos e equidade algorítmica.
100% Offline / Local - Ciência da Computação UDF
"""

from datetime import datetime
import importlib
import json
import os
import streamlit as st
import agent as agent_module

# Garante recarregamento do módulo de regras durante hot-reload do Streamlit
importlib.reload(agent_module)
GradeBotAgent = agent_module.GradeBotAgent

# Diretório base do projeto para resolução segura de caminhos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATALOGO_PATH = os.path.join(BASE_DIR, "catalogo_udf.json")
MEMORIA_PATH = os.path.join(BASE_DIR, "memoria_aluno.json")

# Configuração da página e identidade visual
st.set_page_config(
    page_title="GradeBot | Agente de Grade Curricular",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS institucional, espaçamento calibrado e micro-interações refinadas
st.markdown("""
<style>
    /* Fundo e barra superior */
    .stApp {
        background-color: #F8FAFC;
    }

    [data-testid="stHeader"] {
        background-color: rgba(248, 250, 252, 0.88);
        backdrop-filter: blur(8px);
    }

    /* Respiro superior suficiente para não ser cortado pela barra fixa do Streamlit */
    .block-container {
        padding-top: 4.1rem !important;
        padding-bottom: 5rem !important;
        max-width: 1060px;
    }

    /* Cabeçalho Institucional UDF */
    .udf-header {
        background: linear-gradient(135deg, #003A70 0%, #004A8D 55%, #0072CE 100%);
        color: #FFFFFF;
        padding: 1.35rem 1.75rem;
        border-radius: 14px;
        margin-bottom: 1.15rem;
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 24px rgba(0, 74, 141, 0.12);
    }

    .udf-header-top {
        display: flex;
        align-items: center;
        gap: 0.95rem;
        margin-bottom: 0.6rem;
    }

    .udf-logo-wrap {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .udf-header h1 {
        color: #FFFFFF !important;
        font-size: 1.65rem !important;
        font-weight: 700 !important;
        line-height: 1.15 !important;
        margin: 0 !important;
        letter-spacing: -0.02em;
    }

    .udf-subtitle {
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.92rem;
        margin: 0.2rem 0 0 0;
    }

    .udf-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.75rem;
    }

    .udf-badge {
        display: inline-flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.24);
        color: #FFFFFF;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    /* Botões de atalho rápido sem truncamento */
    div.stButton > button {
        border-radius: 10px;
        border: 1px solid #CBD5E1;
        background-color: #FFFFFF;
        color: #0F172A;
        font-weight: 500;
        font-size: 0.84rem;
        min-height: 44px;
        height: auto !important;
        white-space: normal !important;
        line-height: 1.25 !important;
        padding: 0.45rem 0.65rem;
        transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
                    border-color 150ms ease,
                    background-color 150ms ease,
                    color 150ms ease;
    }

    div.stButton > button p {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: unset !important;
        line-height: 1.2 !important;
        margin: 0 !important;
    }

    @media (max-width: 1120px) {
        [data-testid="stMain"] [data-testid="stHorizontalBlock"] {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
        }
        [data-testid="stMain"] [data-testid="stHorizontalBlock"] > [data-testid="stColumn"] {
            flex: 1 1 calc(50% - 0.5rem) !important;
            min-width: calc(50% - 0.5rem) !important;
        }
    }

    div.stButton > button:hover {
        border-color: #0072CE;
        background-color: #EFF6FF;
        color: #004A8D;
    }

    div.stButton > button:active {
        transform: scale(0.97);
    }

    /* Botão de download com destaque institucional */
    div.stDownloadButton > button {
        background-color: #004A8D;
        color: #FFFFFF;
        border: 1px solid #003A70;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.85rem;
        min-height: 42px;
        height: auto !important;
        white-space: normal !important;
        transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
                    background-color 150ms ease;
    }

    div.stDownloadButton > button:hover {
        background-color: #0072CE;
        border-color: #0072CE;
        color: #FFFFFF;
    }

    div.stDownloadButton > button:active {
        transform: scale(0.97);
    }

    /* Barra lateral compacta para caber acima da dobra */
    [data-testid="stSidebar"] {
        background-color: #FFFFFF;
        border-right: 1px solid #E2E8F0;
    }

    [data-testid="stSidebarUserContent"] {
        padding-top: 0.85rem !important;
        padding-bottom: 0.75rem !important;
    }

    .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding-bottom: 0.15rem;
    }

    .sidebar-brand-title {
        font-size: 0.98rem;
        font-weight: 700;
        color: #004A8D;
        line-height: 1.15;
    }

    .sidebar-brand-sub {
        font-size: 0.74rem;
        color: #475569;
    }

    .sidebar-sep {
        border: none;
        border-top: 1px solid #E2E8F0;
        margin: 0.42rem 0 0.5rem 0;
    }

    .sidebar-section-title {
        font-size: 0.84rem;
        font-weight: 700;
        color: #0F172A;
        margin: 0 0 0.32rem 0;
    }

    .mem-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 0.48rem 0.72rem;
        margin-bottom: 0.38rem;
    }

    .mem-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;
        gap: 0.4rem;
    }

    .mem-card-title {
        font-size: 0.76rem;
        font-weight: 700;
        color: #004A8D;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
    }

    .mem-card-tag {
        font-size: 0.68rem;
        font-weight: 600;
        color: #475569;
        background: #E2E8F0;
        padding: 0.08rem 0.42rem;
        border-radius: 999px;
        white-space: nowrap;
    }

    .mem-stat-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #334155;
        margin-bottom: 0.14rem;
    }

    .mem-stat-label {
        white-space: nowrap;
        color: #475569;
    }

    .mem-stat-val {
        font-weight: 700;
        color: #0F172A;
        text-align: right;
    }

    .progress-track {
        width: 100%;
        height: 6px;
        background-color: #E2E8F0;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 0.42rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #004A8D 0%, #0072CE 100%);
        border-radius: 999px;
    }

    .chip-code {
        display: inline-block;
        background-color: #E0F2FE;
        color: #0369A1;
        border: 1px solid #BAE6FD;
        border-radius: 5px;
        padding: 0.05rem 0.38rem;
        font-size: 0.74rem;
        font-weight: 600;
        margin: 0.12rem 0.18rem 0 0;
    }

    .equity-pill {
        background-color: #ECFDF5;
        border: 1px solid #A7F3D0;
        color: #065F46;
        border-radius: 8px;
        padding: 0.42rem 0.65rem;
        font-size: 0.77rem;
        line-height: 1.35;
        font-weight: 500;
        margin-top: 0.25rem;
    }

    .equity-pill-std {
        background-color: #EFF6FF;
        border: 1px solid #BFDBFE;
        color: #1E40AF;
        border-radius: 8px;
        padding: 0.42rem 0.65rem;
        font-size: 0.77rem;
        line-height: 1.35;
        font-weight: 500;
        margin-top: 0.25rem;
    }

    /* Cartões de mensagens no chat */
    [data-testid="stChatMessage"] {
        background-color: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 0.95rem 1.15rem;
        margin-bottom: 0.75rem;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    /* Visibilidade garantida do campo st.chat_input */
    [data-testid="stChatInput"] {
        border: 1px solid #CBD5E1 !important;
        border-radius: 12px !important;
        background-color: #FFFFFF !important;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
    }

    [data-testid="stChatInput"] textarea,
    [data-testid="stChatInputTextArea"] {
        color: #0F172A !important;
        -webkit-text-fill-color: #0F172A !important;
    }

    [data-testid="stChatInput"] textarea::placeholder,
    [data-testid="stChatInputTextArea"]::placeholder {
        color: #64748B !important;
        -webkit-text-fill-color: #64748B !important;
        opacity: 1 !important;
    }

    .section-kicker {
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
        margin-bottom: 0.45rem;
    }
</style>
""", unsafe_allow_html=True)


def salvar_memoria_em_disco(memoria_dados: dict) -> None:
    """Persiste com segurança o estado de memória longa no disco."""
    try:
        with open(MEMORIA_PATH, "w", encoding="utf-8") as f:
            json.dump(memoria_dados, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


# Inicialização dos estados da sessão (Memória Curta e Memória Média)
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "Olá! Sou o **GradeBot**, seu Agente Acadêmico Autônomo para o curso de "
                "**Ciência da Computação**.\n\n"
                "Estou pronto para ajudar você a planejar seu próximo semestre, validar pré-requisitos, "
                "evitar choques de horário e proteger seu ritmo de estudos com equidade algorítmica.\n\n"
                "**Como começar?** Conte quais matérias já concluiu (ex: *'Concluí CC101 e CC103'*), "
                "peça para eu *'Montar minha grade'* ou consulte pré-requisitos usando os atalhos acima ou o chat abaixo."
            ),
            "logs_camadas": None,
            "grade_md": None,
            "intencao": "SAUDACAO"
        }
    ]

if "simulacoes_sessao" not in st.session_state:
    st.session_state.simulacoes_sessao = []

if "ultima_grade_md" not in st.session_state:
    st.session_state.ultima_grade_md = None

# Instanciação do Agente Autônomo
agent = GradeBotAgent(
    catalogo_path=CATALOGO_PATH,
    memoria_path=MEMORIA_PATH
)

# ---------------- BARRA LATERAL (CONTROLES + PLACEHOLDERS REATIVOS) ----------------
with st.sidebar:
    st.markdown("""
    <div class="sidebar-brand">
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="9" fill="#004A8D"/>
            <path d="M20 9L7 15.5L20 22L33 15.5L20 9Z" fill="#FFFFFF"/>
            <path d="M12 19V26.5C12 28.9853 15.5817 31 20 31C24.4183 31 28 28.9853 28 26.5V19L20 23L12 19Z" fill="#93C5FD"/>
        </svg>
        <div>
            <div class="sidebar-brand-title">GradeBot</div>
            <div class="sidebar-brand-sub">Ciência da Computação • 100% Offline</div>
        </div>
    </div>
    <hr class="sidebar-sep" />
    <div class="sidebar-section-title">Equidade &amp; Perfil Acadêmico</div>
    """, unsafe_allow_html=True)

    trabalhador_toggle = st.checkbox(
        "Estudante trabalha em período integral",
        value=agent.memoria_longa.get("trabalha_periodo_integral", False),
        help="Ativa a mitigação de viés algorítmico: limita a no máximo 1 disciplina de Carga Alta por semestre para prevenir sobrecarga e evasão acadêmica."
    )

    if trabalhador_toggle != agent.memoria_longa.get("trabalha_periodo_integral", False):
        agent.memoria_longa["trabalha_periodo_integral"] = trabalhador_toggle
        agent.memoria_longa["ultima_atualizacao"] = datetime.now().isoformat()
        salvar_memoria_em_disco(agent.memoria_longa)

    if trabalhador_toggle:
        st.markdown(
            '<div class="equity-pill"><strong>Modo Equidade:</strong> Máx. 1 disciplina de Carga Alta e até 4 matérias/semestre.</div>',
            unsafe_allow_html=True
        )
    else:
        st.markdown(
            '<div class="equity-pill-std"><strong>Modo Padrão:</strong> Até 2 disciplinas de Carga Alta e até 5 matérias/semestre.</div>',
            unsafe_allow_html=True
        )

    st.markdown(
        '<hr class="sidebar-sep" /><div class="sidebar-section-title">Gestão de Memória (3 Níveis)</div>',
        unsafe_allow_html=True
    )

    # Placeholders atualizados ao final do turno para refletir o estado real sem atraso
    slot_mem_curta = st.empty()
    slot_mem_media = st.empty()
    slot_mem_longa = st.empty()

    reset_clicado = st.button(
        "Zerar Memória Longa",
        help="Remove todas as disciplinas concluídas salvas em memoria_aluno.json",
        use_container_width=True
    )
    if reset_clicado:
        agent.memoria_longa["disciplinas_concluidas"] = []
        agent.memoria_longa["total_creditos_concluidos"] = 0
        agent.memoria_longa["historico_simulacoes"] = 0
        agent.memoria_longa["ultima_atualizacao"] = datetime.now().isoformat()
        salvar_memoria_em_disco(agent.memoria_longa)
        st.session_state.simulacoes_sessao = []
        st.session_state.ultima_grade_md = None
        st.toast("Memória longa zerada em disco!")

    st.markdown(
        '<hr class="sidebar-sep" /><div class="sidebar-section-title">Exportar Cronograma</div>',
        unsafe_allow_html=True
    )
    slot_download = st.empty()


# ---------------- CABEÇALHO PRINCIPAL & ATALHOS ----------------
st.markdown("""
<div class="udf-header">
    <div class="udf-header-top">
        <div class="udf-logo-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3L1 9L12 15L23 9L12 3Z" fill="#FFFFFF"/>
                <path d="M5 12.5V17.5C5 19.433 8.13401 21 12 21C15.866 21 19 19.433 19 17.5V12.5L12 16.3L5 12.5Z" fill="#BAE6FD"/>
            </svg>
        </div>
        <div>
            <h1>GradeBot</h1>
            <p class="udf-subtitle">Agente Conversacional Autônomo para Planejamento Semestral, Pré-Requisitos e Ética</p>
        </div>
    </div>
    <div class="udf-badges">
        <span class="udf-badge">100% Offline &amp; Local</span>
        <span class="udf-badge">Arquitetura em 4 Camadas</span>
        <span class="udf-badge">Privacy by Design (LGPD)</span>
        <span class="udf-badge">Mitigação de Sobrecarga</span>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown('<div class="section-kicker">Ações rápidas de demonstração</div>', unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns(4)
prompt_atalho = None

with col1:
    if st.button("Montar grade", use_container_width=True):
        prompt_atalho = "Monte minha grade"
with col2:
    if st.button("Concluí CC101/103", use_container_width=True):
        prompt_atalho = "Já concluí CC101 e CC103"
with col3:
    if st.button("Pré-req CC201", use_container_width=True):
        prompt_atalho = "Qual o pré-requisito de CC201?"
with col4:
    if st.button("Teste LGPD (CPF)", use_container_width=True):
        prompt_atalho = "Meu CPF é 123.456.789-00, monte minha grade"


# ---------------- ÁREA DE CONVERSA ----------------
for idx, msg in enumerate(st.session_state.messages):
    avatar = "🎓" if msg["role"] == "assistant" else "👤"
    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])

        if msg.get("logs_camadas"):
            with st.expander("Raciocínio nas 4 Camadas do Agente", expanded=False):
                logs = msg["logs_camadas"]
                st.markdown(f"- **1. Camada Perceptiva (LGPD):** {logs.get('1_perceptiva')}")
                st.markdown(f"- **2. Camada Cognitiva (Intenção):** {logs.get('2_cognitiva')}")
                st.markdown(f"- **3. Camada Decisória (Regras/Equidade):** {logs.get('3_decisoria')}")
                st.markdown(f"- **4. Camada Executiva (Saída):** {logs.get('4_executiva')}")

        if msg.get("grade_md"):
            st.download_button(
                label="Baixar Grade Sugerida (grade_sugerida.md)",
                data=msg["grade_md"],
                file_name="grade_sugerida.md",
                mime="text/markdown",
                key=f"dl_hist_{idx}"
            )


# Entrada via teclado no chat ou via botão de atalho
prompt_chat = st.chat_input("Digite sua solicitação acadêmica (ex: 'Monte minha grade', 'Concluí CC101')...")
prompt_usuario = prompt_atalho if prompt_atalho else prompt_chat

if prompt_usuario:
    # 1. Exibe mensagem do estudante imediatamente
    st.session_state.messages.append({
        "role": "user",
        "content": prompt_usuario
    })
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt_usuario)

    # 2. Processa o fluxo completo através das 4 Camadas do Agente
    with st.chat_message("assistant", avatar="🎓"):
        with st.status("Processando nas 4 camadas do Agente...", expanded=False) as status:
            st.write("**Camada Perceptiva:** Verificando privacidade (LGPD) e higienizando entrada...")
            resultado = agent.processar_mensagem(
                texto_usuario=prompt_usuario,
                trabalha_periodo_integral=trabalhador_toggle
            )
            logs = resultado["logs_camadas"]

            if resultado["bloqueio_lgpd"]:
                st.write(f"🛡️ **Bloqueio Perceptivo:** {logs['1_perceptiva']}")
                st.write(f"**Camada Cognitiva:** {logs['2_cognitiva']}")
                st.write(f"**Camada Decisória:** {logs['3_decisoria']}")
                st.write(f"**Camada Executiva:** {logs['4_executiva']}")
                status.update(
                    label="Bloqueio preventivo LGPD acionado na Camada Perceptiva",
                    state="error",
                    expanded=False
                )
            else:
                st.write(f"✅ **Camada Perceptiva:** {logs['1_perceptiva']}")
                st.write(f"**Camada Cognitiva:** {logs['2_cognitiva']}")
                st.write(f"**Camada Decisória:** {logs['3_decisoria']}")
                st.write(f"**Camada Executiva:** {logs['4_executiva']}")
                status.update(
                    label="Processamento concluído nas 4 camadas do Agente",
                    state="complete",
                    expanded=False
                )

        # Exibe a resposta formatada no chat
        st.markdown(resultado["resposta_texto"])

        # Se houve geração de grade, registra na Memória Média e exibe botão de download
        if resultado.get("grade_md"):
            st.session_state.ultima_grade_md = resultado["grade_md"]
            grade_lista = resultado.get("grade_selecionada") or []
            st.session_state.simulacoes_sessao.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "qtd_disciplinas": len(grade_lista),
                "trabalhador": trabalhador_toggle
            })
            st.download_button(
                label="Baixar Grade Sugerida (grade_sugerida.md)",
                data=resultado["grade_md"],
                file_name="grade_sugerida.md",
                mime="text/markdown",
                key=f"dl_live_{len(st.session_state.messages)}"
            )

        # 3. Atualiza Memória Curta
        st.session_state.messages.append({
            "role": "assistant",
            "content": resultado["resposta_texto"],
            "logs_camadas": logs,
            "grade_md": resultado.get("grade_md"),
            "intencao": resultado.get("intencao", "GERAL")
        })


# ---------------- PREENCHIMENTO REATIVO DA SIDEBAR (ESTADO ATUALIZADO) ----------------
ROTULOS_INTENCAO = {
    "SAUDACAO": "Saudação inicial",
    "MONTAR_GRADE": "Montar grade",
    "CONCLUIR_DISCIPLINA": "Registrar matéria",
    "CONSULTAR_PREREQUISITO": "Pré-requisitos",
    "VER_HISTORICO": "Ver histórico",
    "AUDITAR_ETICA": "Auditoria ética",
    "LISTAR_CATALOGO": "Listar catálogo",
    "LIMPAR_MEMORIA": "Limpar memória",
    "BLOQUEIO_LGPD": "Bloqueio LGPD",
    "AJUDA": "Ajuda",
}

with slot_mem_curta.container():
    msgs = st.session_state.messages
    trocas = sum(1 for m in msgs if m["role"] == "user")
    cod_intencao = msgs[-1].get("intencao", "SAUDACAO") if msgs else "SAUDACAO"
    ultima_intencao = ROTULOS_INTENCAO.get(cod_intencao, cod_intencao)
    st.markdown(f"""
    <div class="mem-card">
        <div class="mem-card-header">
            <span class="mem-card-title">Memória Curta</span>
            <span class="mem-card-tag">Sessão</span>
        </div>
        <div class="mem-stat-row"><span class="mem-stat-label">Mensagens:</span><span class="mem-stat-val">{len(msgs)} ({trocas} do aluno)</span></div>
        <div class="mem-stat-row"><span class="mem-stat-label">Última intenção:</span><span class="mem-stat-val">{ultima_intencao}</span></div>
    </div>
    """, unsafe_allow_html=True)

with slot_mem_media.container():
    sims = st.session_state.simulacoes_sessao
    ultima_str = "Nenhuma ainda"
    if sims:
        ult = sims[-1]
        modo = "Equidade" if ult["trabalhador"] else "Padrão"
        ultima_str = f"{ult['qtd_disciplinas']} mat. · {modo} · {ult['timestamp']}"
    st.markdown(f"""
    <div class="mem-card">
        <div class="mem-card-header">
            <span class="mem-card-title">Memória Média</span>
            <span class="mem-card-tag">Simulações</span>
        </div>
        <div class="mem-stat-row"><span class="mem-stat-label">Simuladas:</span><span class="mem-stat-val">{len(sims)}</span></div>
        <div class="mem-stat-row"><span class="mem-stat-label">Último cenário:</span><span class="mem-stat-val">{ultima_str}</span></div>
    </div>
    """, unsafe_allow_html=True)

with slot_mem_longa.container():
    concluidas = agent.memoria_longa.get("disciplinas_concluidas", [])
    total_cat = max(len(agent.catalogo), 1)
    progresso_pct = min(round((len(concluidas) / total_cat) * 100), 100)
    total_cred = agent.memoria_longa.get("total_creditos_concluidos", len(concluidas) * 4)

    chips_html = (
        "".join([f'<span class="chip-code">{c}</span>' for c in concluidas])
        if concluidas
        else '<span style="font-size:0.76rem;color:#64748B;">Nenhuma matéria concluída ainda.</span>'
    )

    st.markdown(f"""
    <div class="mem-card">
        <div class="mem-card-header">
            <span class="mem-card-title">Memória Longa</span>
            <span class="mem-card-tag">memoria_aluno.json</span>
        </div>
        <div class="mem-stat-row"><span class="mem-stat-label">Concluídas:</span><span class="mem-stat-val">{len(concluidas)} / {len(agent.catalogo)} ({total_cred} cr.)</span></div>
        <div class="progress-track"><div class="progress-fill" style="width: {progresso_pct}%;"></div></div>
        <div style="margin-top:0.35rem;">{chips_html}</div>
    </div>
    """, unsafe_allow_html=True)

with slot_download.container():
    if st.session_state.ultima_grade_md:
        st.download_button(
            label="Baixar grade_sugerida.md",
            data=st.session_state.ultima_grade_md,
            file_name="grade_sugerida.md",
            mime="text/markdown",
            use_container_width=True,
            key="dl_sidebar_btn"
        )
    else:
        st.caption("Peça **'Montar grade'** para liberar o download em Markdown.")
