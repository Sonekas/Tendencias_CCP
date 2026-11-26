"""
Suíte de Testes Automatizados - GradeBot
Testes unitários e integrados cobrindo as 4 Camadas de IA:
Perceptiva (LGPD), Cognitiva (NLP), Decisória (Regras/Equidade) e Executiva (Persistência).
"""

import json
import os
import tempfile
import pytest
from agent import (
    PerceptiveLayer,
    CognitiveLayer,
    DecisionalLayer,
    ExecutiveLayer,
    GradeBotAgent
)


@pytest.fixture
def catalogo_mock():
    """Catálogo mínimo de teste para validações determinísticas."""
    return [
        {
            "codigo": "CC101",
            "nome": "Algoritmos e Programação Estruturada",
            "semestre": 1,
            "dia_semana": "Segunda-feira",
            "turno": "Noturno",
            "prerequisito": None,
            "carga_estudo": "Alta",
            "creditos": 4
        },
        {
            "codigo": "CC102",
            "nome": "Introdução à Computação",
            "semestre": 1,
            "dia_semana": "Terça-feira",
            "turno": "Noturno",
            "prerequisito": None,
            "carga_estudo": "Média",
            "creditos": 4
        },
        {
            "codigo": "CC103",
            "nome": "Cálculo Diferencial I",
            "semestre": 1,
            "dia_semana": "Quarta-feira",
            "turno": "Noturno",
            "prerequisito": None,
            "carga_estudo": "Alta",
            "creditos": 4
        },
        {
            "codigo": "CC201",
            "nome": "Estruturas de Dados Avançadas",
            "semestre": 2,
            "dia_semana": "Segunda-feira",
            "turno": "Noturno",
            "prerequisito": "CC101",
            "carga_estudo": "Alta",
            "creditos": 4
        },
        {
            "codigo": "CC202",
            "nome": "Banco de Dados",
            "semestre": 2,
            "dia_semana": "Terça-feira",
            "turno": "Noturno",
            "prerequisito": "CC101",
            "carga_estudo": "Média",
            "creditos": 4
        }
    ]


# ---------------- 1. TESTES DA CAMADA PERCEPTIVA (LGPD) ----------------

def test_perceptive_layer_bloqueia_cpf_formatado():
    mensagem = "Meu CPF é 123.456.789-00, monte minha grade"
    res = PerceptiveLayer.processar(mensagem)
    assert res["aprovado"] is False
    assert res["violacao_lgpd"] is True
    assert "Número de CPF" in res["itens_violados"]
    assert "LGPD" in res["mensagem_resposta"]


def test_perceptive_layer_bloqueia_cpf_numerico():
    mensagem = "Favor registrar 98765432100 nas matérias"
    res = PerceptiveLayer.processar(mensagem)
    assert res["aprovado"] is False
    assert res["violacao_lgpd"] is True
    assert "Número de CPF" in res["itens_violados"]


def test_perceptive_layer_bloqueia_senha():
    mensagem = "minha senha: 12345secret e quero ver a grade"
    res = PerceptiveLayer.processar(mensagem)
    assert res["aprovado"] is False
    assert res["violacao_lgpd"] is True
    assert any("Senha" in item for item in res["itens_violados"])


def test_perceptive_layer_permite_mensagem_academica_sem_pii():
    mensagem = "Olá, já cursei CC101 e gostaria de cursar Banco de Dados."
    res = PerceptiveLayer.processar(mensagem)
    assert res["aprovado"] is True
    assert res["violacao_lgpd"] is False
    assert res["texto_higienizado"] == mensagem


# ---------------- 2. TESTES DA CAMADA COGNITIVA (NLP & ENTIDADES) ----------------

def test_cognitive_layer_detecta_intencao_montar_grade(catalogo_mock):
    texto = "Por favor, sugira as matérias para montar minha grade semestral"
    res = CognitiveLayer.processar(texto, catalogo_mock)
    assert res["intencao"] == "MONTAR_GRADE"


def test_cognitive_layer_detecta_intencao_concluir(catalogo_mock):
    texto = "Já concluí CC101 e CC102 no semestre passado"
    res = CognitiveLayer.processar(texto, catalogo_mock)
    assert res["intencao"] == "CONCLUIR_DISCIPLINA"
    assert "CC101" in res["disciplinas_mencionadas"]
    assert "CC102" in res["disciplinas_mencionadas"]


def test_cognitive_layer_reconhece_sinonimos_disciplinas(catalogo_mock):
    texto = "Passei em Algoritmos e quero fazer Estruturas de Dados"
    res = CognitiveLayer.processar(texto, catalogo_mock)
    assert "CC101" in res["disciplinas_mencionadas"]
    assert "CC201" in res["disciplinas_mencionadas"]


def test_cognitive_layer_detecta_intencao_consultar_prerequisito(catalogo_mock):
    texto = "Qual o pré-requisito de CC201?"
    res = CognitiveLayer.processar(texto, catalogo_mock)
    assert res["intencao"] == "CONSULTAR_PREREQUISITO"
    assert "CC201" in res["disciplinas_mencionadas"]


# ---------------- 3. TESTES DA CAMADA DECISÓRIA (REGRAS & EQUIDADE) ----------------

def test_decisional_layer_bloqueia_disciplina_com_prerequisito_pendente(catalogo_mock):
    # Aluno não concluiu CC101, então CC201 deve ser bloqueada
    memoria_aluno = {"disciplinas_concluidas": []}
    res = DecisionalLayer.deliberar(
        intencao="MONTAR_GRADE",
        disciplinas_mencionadas=[],
        catalogo=catalogo_mock,
        memoria_longa=memoria_aluno,
        trabalha_periodo_integral=False
    )
    assert res["tipo"] == "GRADE_GERADA"
    codigos_sugeridos = [d["codigo"] for d in res["grade_selecionada"]]
    assert "CC201" not in codigos_sugeridos
    
    # Verifica registro da justificativa do bloqueio
    bloqueados_prereq = [b["disciplina"]["codigo"] for b in res["bloqueadas_prereq"]]
    assert "CC201" in bloqueados_prereq


def test_decisional_layer_libera_disciplina_apos_concluir_prerequisito(catalogo_mock):
    # Aluno concluiu CC101, logo CC201 pode ser sugerida
    memoria_aluno = {"disciplinas_concluidas": ["CC101"]}
    res = DecisionalLayer.deliberar(
        intencao="MONTAR_GRADE",
        disciplinas_mencionadas=[],
        catalogo=catalogo_mock,
        memoria_longa=memoria_aluno,
        trabalha_periodo_integral=False
    )
    codigos_sugeridos = [d["codigo"] for d in res["grade_selecionada"]]
    assert "CC201" in codigos_sugeridos or "CC202" in codigos_sugeridos


def test_decisional_layer_mitigacao_vies_trabalhador(catalogo_mock):
    """
    Testa se o perfil de trabalhador limita a no máximo 1 disciplina de Carga Alta,
    enquanto perfil padrão pode sugerir até 2.
    """
    memoria_aluno = {"disciplinas_concluidas": []}

    # Perfil 1: Trabalhador período integral -> máx 1 carga Alta
    res_trabalhador = DecisionalLayer.deliberar(
        intencao="MONTAR_GRADE",
        disciplinas_mencionadas=[],
        catalogo=catalogo_mock,
        memoria_longa=memoria_aluno,
        trabalha_periodo_integral=True
    )
    cargas_altas_trab = [d for d in res_trabalhador["grade_selecionada"] if d["carga_estudo"] == "Alta"]
    assert len(cargas_altas_trab) <= 1
    assert len(res_trabalhador["bloqueadas_sobrecarga_trabalhador"]) > 0

    # Perfil 2: Não trabalha período integral -> permite até 2 de carga Alta
    res_padrao = DecisionalLayer.deliberar(
        intencao="MONTAR_GRADE",
        disciplinas_mencionadas=[],
        catalogo=catalogo_mock,
        memoria_longa=memoria_aluno,
        trabalha_periodo_integral=False
    )
    cargas_altas_padrao = [d for d in res_padrao["grade_selecionada"] if d["carga_estudo"] == "Alta"]
    assert len(cargas_altas_padrao) == 2


def test_decisional_layer_evita_choque_horario(catalogo_mock):
    # CC101 e CC201 caem ambas na Segunda-feira Noturno
    # Se o aluno tiver concluído CC101, CC201 ocupa a segunda. Duas matérias na segunda não podem coexistir.
    memoria_aluno = {"disciplinas_concluidas": []}
    res = DecisionalLayer.deliberar(
        intencao="MONTAR_GRADE",
        disciplinas_mencionadas=[],
        catalogo=catalogo_mock,
        memoria_longa=memoria_aluno,
        trabalha_periodo_integral=False
    )
    dias = [d["dia_semana"] for d in res["grade_selecionada"]]
    # Não pode haver repetição de dia no mesmo turno
    assert len(dias) == len(set(dias))


# ---------------- 4. TESTE INTEGRADO DO AGENTE (4 CAMADAS COMPLETAS) ----------------

def test_gradebot_agent_fluxo_completo_com_memoria_persistente():
    with tempfile.TemporaryDirectory() as tmpdir:
        cat_file = os.path.join(tmpdir, "catalogo.json")
        mem_file = os.path.join(tmpdir, "memoria.json")

        catalogo = [
            {
                "codigo": "CC101",
                "nome": "Algoritmos",
                "semestre": 1,
                "dia_semana": "Segunda-feira",
                "turno": "Noturno",
                "prerequisito": None,
                "carga_estudo": "Alta",
                "creditos": 4
            },
            {
                "codigo": "CC201",
                "nome": "Estruturas de Dados",
                "semestre": 2,
                "dia_semana": "Terça-feira",
                "turno": "Noturno",
                "prerequisito": "CC101",
                "carga_estudo": "Alta",
                "creditos": 4
            }
        ]

        with open(cat_file, "w", encoding="utf-8") as f:
            json.dump(catalogo, f)

        # 1. Instanciar agente
        agent = GradeBotAgent(catalogo_path=cat_file, memoria_path=mem_file)

        # 2. Registrar aprovação em CC101
        res1 = agent.processar_mensagem("Já concluí CC101")
        assert res1["sucesso"] is True
        assert "CC101" in res1["memoria_longa"]["disciplinas_concluidas"]

        # 3. Solicitar montagem de grade (agora CC201 deve ser liberada)
        res2 = agent.processar_mensagem("Monte minha grade semestral")
        assert res2["sucesso"] is True
        assert "CC201" in res2["resposta_texto"]
        assert res2["grade_md"] is not None
        assert "# UDF" in res2["grade_md"]

        # 4. Testar tentativa adversarial de invasão com CPF
        res_adv = agent.processar_mensagem("Meu CPF 111.222.333-44 foi cadastrado?")
        assert res_adv["sucesso"] is False
        assert res_adv["bloqueio_lgpd"] is True
        assert "LGPD" in res_adv["resposta_texto"]
