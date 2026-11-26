"""
GradeBot - Motor do Agente Conversacional Autônomo
Arquitetura em 4 Camadas de IA: Perceptiva, Cognitiva, Decisória e Executiva.
100% Offline e orientado a regras éticas, LGPD e validação acadêmica.
"""

from __future__ import annotations
import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


class PerceptiveLayer:
    """
    Camada 1: Perceptiva
    Responsável pela captura, higienização e filtro de Privacidade by Design (LGPD).
    Bloqueia ativamente CPFs, RGs ou senhas antes de qualquer processamento interno.
    """

    # Expressões regulares para detecção de PII (Personally Identifiable Information)
    REGEX_CPF_FORMATADO = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")
    REGEX_CPF_DIGITOS = re.compile(r"\b\d{11}\b")
    REGEX_RG = re.compile(r"\b(?:rg|identidade|documento)[\s:=]*([0-9a-zA-Z\.\-]{5,15})\b", re.IGNORECASE)
    REGEX_SENHA = re.compile(r"\b(?:senha|password|pin|token|secret)[\s:=]+([^\s,;]+)\b", re.IGNORECASE)

    @classmethod
    def processar(cls, texto_usuario: str) -> Dict[str, Any]:
        """
        Analisa a mensagem de entrada.
        Retorna dicionário com status de aprovação, mensagem higienizada ou alerta de violação LGPD.
        """
        texto_limpo = texto_usuario.strip()

        # 1. Verificação de CPF
        match_cpf_fmt = cls.REGEX_CPF_FORMATADO.search(texto_limpo)
        match_cpf_dig = cls.REGEX_CPF_DIGITOS.search(texto_limpo)
        
        # Filtro de falsos positivos para 11 dígitos comuns (ex: telefones com ddd)
        cpf_detectado = None
        if match_cpf_fmt:
            cpf_detectado = match_cpf_fmt.group(0)
        elif match_cpf_dig:
            val = match_cpf_dig.group(0)
            # Não é um timestamp comum e parece formato de CPF
            if not val.startswith("19") and not val.startswith("20"):
                cpf_detectado = val

        # 2. Verificação de RG
        match_rg = cls.REGEX_RG.search(texto_limpo)

        # 3. Verificação de Senha
        match_senha = cls.REGEX_SENHA.search(texto_limpo)

        if cpf_detectado or match_rg or match_senha:
            detalhe_violacao = []
            if cpf_detectado:
                detalhe_violacao.append("Número de CPF")
            if match_rg:
                detalhe_violacao.append("Registro Geral (RG)")
            if match_senha:
                detalhe_violacao.append("Credencial de Acesso (Senha/Token)")

            alerta_lgpd = (
                "🛡️ **[Filtro de Privacidade LGPD Ativado]**\n\n"
                f"Detectamos dados pessoais sensíveis/identificadores ({', '.join(detalhe_violacao)}) "
                "em sua mensagem. Em conformidade com o **Princípio da Coleta Mínima e da Minimização de Dados** "
                "(Art. 6º, III da Lei 13.709/2018 - LGPD), o GradeBot **não armazena nem processa** documentos civis ou senhas.\n\n"
                "**Ação:** O processamento foi interrompido preventivamente e nenhum dado foi registrado em disco. "
                "Por favor, envie sua dúvida acadêmica apenas com os nomes ou códigos das disciplinas (ex: CC101, Cálculo I)."
            )

            return {
                "aprovado": False,
                "texto_higienizado": None,
                "violacao_lgpd": True,
                "itens_violados": detalhe_violacao,
                "mensagem_resposta": alerta_lgpd,
                "log_percepcao": f"Bloqueio preventivo LGPD acionado para: {', '.join(detalhe_violacao)}."
            }

        return {
            "aprovado": True,
            "texto_higienizado": texto_limpo,
            "violacao_lgpd": False,
            "itens_violados": [],
            "mensagem_resposta": None,
            "log_percepcao": "Entrada validada com sucesso. Sem dados sensíveis PII detectados (Privacy by Design atendido)."
        }


class CognitiveLayer:
    """
    Camada 2: Cognitiva
    Interpretação da intenção do estudante em linguagem natural e extração de entidades acadêmicas.
    100% offline via análise léxico-semântica determinística.
    """

    INTENCOES = {
        "CONCLUIR_DISCIPLINA": [
            "conclui", "concluida", "concluidas", "cursei", "ja fiz", "fiz", "passei",
            "aprovado", "aprovada", "fechei", "terminei", "adicione", "cadastrar materia"
        ],
        "MONTAR_GRADE": [
            "montar grade", "monte grade", "monte minha grade", "monte", "montar", "sugira grade",
            "sugerir grade", "sugira", "sugerir", "grade horaria", "grade semestral",
            "cronograma", "o que cursar", "disciplinas recomendadas", "proximo semestre",
            "planejar semestre", "quais materias pegar", "montagem de grade"
        ],
        "CONSULTAR_PREREQUISITO": [
            "prerequisito", "pre-requisito", "requisito", "o que preciso para",
            "posso fazer", "posso cursar", "exige", "depende de", "detalhes de"
        ],
        "VER_HISTORICO": [
            "historico", "minhas materias", "concluidas", "meu progresso", "disciplinas feitas",
            "meu status", "ver memoria", "o que ja fiz"
        ],
        "AUDITAR_ETICA": [
            "etica", "vies", "bias", "equidade", "trabalhador", "sobrecarga", "burnout",
            "lgpd", "privacidade", "por que limitou", "explicar decisao", "criterios"
        ],
        "LISTAR_CATALOGO": [
            "catalogo", "grade curricular", "todas as materias", "disciplinas disponiveis",
            "cursos", "ementa", "lista de materias"
        ],
        "LIMPAR_MEMORIA": [
            "limpar memoria", "resetar memoria", "limpar historico", "resetar", "zerar",
            "esquecer tudo", "apagar historico", "comecar de novo"
        ],
        "AJUDA": [
            "ajuda", "help", "como funciona", "comandos", "ola", "oi", "bom dia", "boa noite"
        ]
    }

    # Mapeamento fonético/sinônimo de disciplinas comuns da UDF
    SINONIMOS_DISCIPLINAS = {
        "algoritmos": "CC101",
        "programacao estruturada": "CC101",
        "logica de programacao": "CC101",
        "circuitos": "CC102",
        "circuitos digitais": "CC102",
        "introducao a computacao": "CC102",
        "calculo 1": "CC103",
        "calculo i": "CC103",
        "calculo diferencial": "CC103",
        "redes": "CC104",
        "redes de computadores": "CC104",
        "estruturas de dados": "CC201",
        "estrutura de dados": "CC201",
        "ed": "CC201",
        "banco de dados": "CC202",
        "bd": "CC202",
        "sql": "CC202",
        "calculo 2": "CC203",
        "calculo ii": "CC203",
        "engenharia de software": "CC204",
        "metodologias ageis": "CC204",
        "scrum": "CC204",
        "inteligencia artificial": "CC301",
        "ia": "CC301",
        "machine learning": "CC301",
        "sistemas operacionais": "CC302",
        "so": "CC302"
    }

    @classmethod
    def normalizar_texto(cls, texto: str) -> str:
        """Remove acentos e converte para minúsculas."""
        substituicoes = {
            "á": "a", "à": "a", "ã": "a", "â": "a",
            "é": "e", "ê": "e", "í": "i", "ó": "o",
            "õ": "o", "ô": "o", "ú": "u", "ç": "c"
        }
        texto_norm = texto.lower()
        for k, v in substituicoes.items():
            texto_norm = texto_norm.replace(k, v)
        return texto_norm

    @classmethod
    def processar(cls, texto: str, catalogo: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Classifica a intenção e extrai entidades como códigos de matérias mencionadas.
        """
        texto_norm = cls.normalizar_texto(texto)

        # 1. Extração de Códigos Explícitos (ex: CC101, CC203)
        codigos_encontrados = set(re.findall(r"\bCC\d{3}\b", texto.upper()))

        # 2. Extração por Sinônimos/Nomes
        for sin, cod in cls.SINONIMOS_DISCIPLINAS.items():
            if sin in texto_norm:
                codigos_encontrados.add(cod)

        # 3. Classificação de Intenção por pontuação de termos
        intencao_identificada = "AJUDA"
        maior_pontuacao = 0

        for intencao, termos in cls.INTENCOES.items():
            pontuacao = 0
            for termo in termos:
                if termo in texto_norm:
                    # Termos mais longos têm maior peso de especificidade
                    pontuacao += len(termo.split()) * 2
            if pontuacao > maior_pontuacao:
                maior_pontuacao = pontuacao
                intencao_identificada = intencao

        # Heurística de refinamento: se o usuário apenas digitou códigos com palavras de conclusão
        if codigos_encontrados and any(p in texto_norm for p in ["passei", "conclui", "fiz", "cursei", "fechei", "ja fiz"]):
            intencao_identificada = "CONCLUIR_DISCIPLINA"
        elif codigos_encontrados and any(p in texto_norm for p in ["requisito", "posso", "fazer", "cursar", "exige", "detalhes"]):
            intencao_identificada = "CONSULTAR_PREREQUISITO"
        elif not codigos_encontrados and any(p in texto_norm for p in ["grade", "montar", "sugira", "semestre"]):
            intencao_identificada = "MONTAR_GRADE"

        return {
            "intencao": intencao_identificada,
            "disciplinas_mencionadas": sorted(list(codigos_encontrados)),
            "confianca_heuristica": 0.95 if maior_pontuacao > 0 else 0.60,
            "log_cognitivo": f"Intenção detectada: '{intencao_identificada}' | Entidades detectadas: {sorted(list(codigos_encontrados)) or 'Nenhuma'}"
        }


class DecisionalLayer:
    """
    Camada 3: Decisória
    Raciocínio lógico, validação de pré-requisitos, choque de horários e
    aplicação do Princípio da Equidade (Mitigação de Sobrecarga para Estudantes Trabalhadores).
    """

    @classmethod
    def deliberar(
        cls,
        intencao: str,
        disciplinas_mencionadas: List[str],
        catalogo: List[Dict[str, Any]],
        memoria_longa: Dict[str, Any],
        trabalha_periodo_integral: bool
    ) -> Dict[str, Any]:
        """
        Aplica regras acadêmicas estritas e delibera o plano de resposta do agente.
        """
        mapa_catalogo = {d["codigo"]: d for d in catalogo}
        concluidas = set(memoria_longa.get("disciplinas_concluidas", []))

        # DECISÃO 1: CONCLUIR DISCIPLINA
        if intencao == "CONCLUIR_DISCIPLINA":
            if not disciplinas_mencionadas:
                return {
                    "tipo": "ERRO_ENTIDADE",
                    "mensagem": "Não consegui identificar qual disciplina você concluiu. Por favor, informe o código (ex: `CC101`) ou nome (ex: `Algoritmos`).",
                    "log_decisao": "Falha na Camada Decisória: nenhuma disciplina válida fornecida para registro."
                }

            novas_concluidas = []
            ja_estavam_concluidas = []
            inexistentes = []

            for cod in disciplinas_mencionadas:
                if cod not in mapa_catalogo:
                    inexistentes.append(cod)
                elif cod in concluidas:
                    ja_estavam_concluidas.append(cod)
                else:
                    novas_concluidas.append(cod)
                    concluidas.add(cod)

            return {
                "tipo": "DISCIPLINAS_REGISTRADAS",
                "novas_concluidas": novas_concluidas,
                "ja_estavam_concluidas": ja_estavam_concluidas,
                "inexistentes": inexistentes,
                "historico_atualizado": sorted(list(concluidas)),
                "log_decisao": f"Registradas {len(novas_concluidas)} novas matérias. Histórico total: {len(concluidas)} disciplinas."
            }

        # DECISÃO 2: CONSULTAR PRÉ-REQUISITO
        if intencao == "CONSULTAR_PREREQUISITO":
            if not disciplinas_mencionadas:
                return {
                    "tipo": "ERRO_ENTIDADE",
                    "mensagem": "Qual disciplina você gostaria de consultar? Exemplo: 'Qual o pré-requisito de CC201?' ou 'Posso cursar Inteligência Artificial?'.",
                    "log_decisao": "Consulta de pré-requisito sem disciplina especificada."
                }

            detalhes = []
            for cod in disciplinas_mencionadas:
                disc = mapa_catalogo.get(cod)
                if not disc:
                    detalhes.append({"codigo": cod, "encontrada": False})
                    continue

                prereq_cod = disc.get("prerequisito")
                prereq_cumprido = True
                prereq_nome = None

                if prereq_cod:
                    prereq_cumprido = prereq_cod in concluidas
                    prereq_disc = mapa_catalogo.get(prereq_cod)
                    prereq_nome = prereq_disc["nome"] if prereq_disc else prereq_cod

                detalhes.append({
                    "codigo": cod,
                    "nome": disc["nome"],
                    "encontrada": True,
                    "prerequisito_codigo": prereq_cod,
                    "prerequisito_nome": prereq_nome,
                    "prerequisito_cumprido": prereq_cumprido,
                    "carga_estudo": disc["carga_estudo"],
                    "dia_semana": disc["dia_semana"],
                    "turno": disc["turno"],
                    "ja_concluida": cod in concluidas
                })

            return {
                "tipo": "RESULTADO_PREREQUISITOS",
                "detalhes": detalhes,
                "log_decisao": f"Consulta de pré-requisitos processada para {len(detalhes)} disciplinas."
            }

        # DECISÃO 3: MONTAR GRADE (O Coração do Agente)
        if intencao == "MONTAR_GRADE":
            pendentes = [d for d in catalogo if d["codigo"] not in concluidas]

            if not pendentes:
                return {
                    "tipo": "TODAS_CONCLUIDAS",
                    "mensagem": "Parabéns! Você já concluiu todas as disciplinas disponíveis no catálogo do curso de Ciência da Computação UDF!",
                    "log_decisao": "Aluno concluiu 100% da grade curricular cadastrada."
                }

            # 1. Avaliar pré-requisitos
            elegiveis = []
            bloqueadas_prereq = []

            for disc in pendentes:
                prereq = disc.get("prerequisito")
                if not prereq or prereq in concluidas:
                    elegiveis.append(disc)
                else:
                    disc_prereq = mapa_catalogo.get(prereq, {})
                    bloqueadas_prereq.append({
                        "disciplina": disc,
                        "prerequisito_pendente": prereq,
                        "nome_prerequisito": disc_prereq.get("nome", prereq)
                    })

            # Ordenar candidatas por semestre ideal e depois por carga
            # Damos prioridade para matérias com menor semestre para manter progressão
            elegiveis.sort(key=lambda d: (d["semestre"], 0 if d["carga_estudo"] == "Alta" else 1))

            # 2. Prevenção de Choques de Horário e Mitigação de Sobrecarga (Equidade)
            grade_selecionada = []
            bloqueadas_choque = []
            bloqueadas_sobrecarga_trabalhador = []
            dias_ocupados = set()
            contador_carga_alta = 0

            # Limite de disciplinas com Carga "Alta":
            # Se trabalha período integral: Teto RÍGIDO de 1 disciplina de Carga Alta
            # Se não trabalha: Até 2 disciplinas de Carga Alta por semestre
            teto_carga_alta = 1 if trabalha_periodo_integral else 2
            teto_disciplinas_total = 4 if trabalha_periodo_integral else 5

            for disc in elegiveis:
                dia = disc["dia_semana"]
                turno = disc["turno"]
                chave_horario = f"{dia}_{turno}"

                # Teste 1: Choque de Horário
                if chave_horario in dias_ocupados:
                    # Descobre qual matéria já pegou este horário
                    mat_ocupante = next(m for m in grade_selecionada if f"{m['dia_semana']}_{m['turno']}" == chave_horario)
                    bloqueadas_choque.append({
                        "disciplina": disc,
                        "conflito_com": mat_ocupante
                    })
                    continue

                # Teste 2: Mitigação de Viés / Sobrecarga Cognitiva (Equidade do Estudante Trabalhador)
                if disc["carga_estudo"] == "Alta":
                    if contador_carga_alta >= teto_carga_alta:
                        bloqueadas_sobrecarga_trabalhador.append({
                            "disciplina": disc,
                            "limite_atingido": teto_carga_alta,
                            "motivo": (
                                f"Limite de {teto_carga_alta} disciplina(s) de carga ALTA atingido "
                                f"({'Perfil Trabalhador Período Integral' if trabalha_periodo_integral else 'Diretriz Acadêmica Padrão'})."
                            )
                        })
                        continue

                # Teste 3: Teto total de disciplinas sugeridas para o semestre
                if len(grade_selecionada) >= teto_disciplinas_total:
                    break

                # Aprova matéria na grade
                grade_selecionada.append(disc)
                dias_ocupados.add(chave_horario)
                if disc["carga_estudo"] == "Alta":
                    contador_carga_alta += 1

            return {
                "tipo": "GRADE_GERADA",
                "grade_selecionada": grade_selecionada,
                "bloqueadas_prereq": bloqueadas_prereq,
                "bloqueadas_choque": bloqueadas_choque,
                "bloqueadas_sobrecarga_trabalhador": bloqueadas_sobrecarga_trabalhador,
                "trabalha_periodo_integral": trabalha_periodo_integral,
                "total_creditos": sum(d.get("creditos", 4) for d in grade_selecionada),
                "contador_carga_alta": contador_carga_alta,
                "log_decisao": (
                    f"Grade gerada com {len(grade_selecionada)} disciplinas. "
                    f"Carga Alta: {contador_carga_alta}/{teto_carga_alta}. "
                    f"Bloqueios: {len(bloqueadas_prereq)} por pré-requisito, "
                    f"{len(bloqueadas_choque)} por choque, "
                    f"{len(bloqueadas_sobrecarga_trabalhador)} por equidade/sobrecarga."
                )
            }

        # DECISÃO 4: VER HISTÓRICO
        if intencao == "VER_HISTORICO":
            disciplinas_obj = [mapa_catalogo[c] for c in concluidas if c in mapa_catalogo]
            return {
                "tipo": "EXIBIR_HISTORICO",
                "disciplinas_concluidas": disciplinas_obj,
                "total_creditos": sum(d.get("creditos", 4) for d in disciplinas_obj),
                "log_decisao": f"Histórico consultado: {len(disciplinas_obj)} disciplinas concluídas."
            }

        # DECISÃO 5: AUDITAR ÉTICA E VIÉS
        if intencao == "AUDITAR_ETICA":
            return {
                "tipo": "EXPLICACAO_ETICA",
                "trabalha_periodo_integral": trabalha_periodo_integral,
                "log_decisao": "Auditoria de princípios éticos e interpretabilidade algorítmica solicitada."
            }

        # DECISÃO 6: LISTAR CATÁLOGO
        if intencao == "LISTAR_CATALOGO":
            return {
                "tipo": "LISTAR_CATALOGO",
                "catalogo": catalogo,
                "concluidas": list(concluidas),
                "log_decisao": f"Exibição do catálogo completo da UDF ({len(catalogo)} disciplinas)."
            }

        # DECISÃO 7: LIMPAR MEMÓRIA
        if intencao == "LIMPAR_MEMORIA":
            return {
                "tipo": "CONFIRMAR_LIMPEZA_MEMORIA",
                "log_decisao": "Comando para zerar memória persistente recebido."
            }

        # DECISÃO 8: AJUDA / PADRÃO
        return {
            "tipo": "MENSAGEM_AJUDA",
            "log_decisao": "Apresentação do menu de capacidades do agente."
        }


class ExecutiveLayer:
    """
    Camada 4: Executiva
    Gera as saídas ricas em Markdown, atualiza a persistência local (memoria_aluno.json)
    e cria o arquivo de exportação de cronograma (grade_sugerida.md).
    """

    @classmethod
    def executar(
        cls,
        decisao: Dict[str, Any],
        memoria_path: str,
        memoria_longa: Dict[str, Any],
        catalogo: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Gera o texto de resposta ao usuário, atualiza a memória e compila arquivos de exportação.
        """
        tipo = decisao["tipo"]
        resposta_md = ""
        grade_md_export = None
        atualizar_memoria = False

        if tipo == "DISCIPLINAS_REGISTRADAS":
            atualizar_memoria = True
            memoria_longa["disciplinas_concluidas"] = decisao["historico_atualizado"]
            memoria_longa["ultima_atualizacao"] = datetime.now().isoformat()
            memoria_longa["total_creditos_concluidos"] = len(decisao["historico_atualizado"]) * 4

            mapa = {d["codigo"]: d["nome"] for d in catalogo}
            novas = [f"- **{c}** ({mapa.get(c, c)})" for c in decisao["novas_concluidas"]]
            ja_feitas = [f"- **{c}**" for c in decisao["ja_estavam_concluidas"]]

            resposta_md = "**Histórico Acadêmico Atualizado com Sucesso!**\n\n"
            if novas:
                resposta_md += "**Disciplinas registradas agora como concluídas:**\n" + "\n".join(novas) + "\n\n"
            if ja_feitas:
                resposta_md += "**Disciplinas que já estavam no seu histórico:**\n" + "\n".join(ja_feitas) + "\n\n"
            if decisao.get("inexistentes"):
                resposta_md += f"⚠️ **Códigos não encontrados no catálogo:** {', '.join(decisao['inexistentes'])}\n\n"

            resposta_md += (
                f"**Progresso Geral:** Você possui **{len(decisao['historico_atualizado'])} de {len(catalogo)}** "
                f"disciplinas concluídas ({memoria_longa['total_creditos_concluidos']} créditos).\n\n"
                "*Dica:* Digite **'monte minha grade'** para simular o próximo semestre considerando suas conquistas."
            )

        elif tipo == "RESULTADO_PREREQUISITOS":
            resposta_md = "**Consulta de Pré-requisitos e Ementas:**\n\n"
            for item in decisao["detalhes"]:
                if not item["encontrada"]:
                    resposta_md += f"❌ Disciplina `{item['codigo']}` não encontrada no catálogo.\n\n"
                    continue

                status_concluida = "✅ *(Concluída)*" if item["ja_concluida"] else "⏳ *(Pendente no histórico)*"
                resposta_md += f"**{item['codigo']} — {item['nome']}** {status_concluida}\n\n"
                resposta_md += f"- **Horário:** {item['dia_semana']} ({item['turno']})\n"
                resposta_md += f"- **Carga de Estudo Estimada:** `{item['carga_estudo']}`\n"

                prereq_cod = item["prerequisito_codigo"]
                if prereq_cod:
                    icone_req = "✅" if item["prerequisito_cumprido"] else "🔒"
                    status_req = "Cumprido" if item["prerequisito_cumprido"] else "NÃO CUMPRIDO — Bloqueio Ativo"
                    resposta_md += f"- **Pré-requisito Obrigatório:** {icone_req} `{prereq_cod}` - {item['prerequisito_nome']} ({status_req})\n"
                else:
                    resposta_md += "- **Pré-requisito:** Nenhum (Disciplina de entrada livre)\n"
                resposta_md += "\n"

        elif tipo == "GRADE_GERADA":
            grade = decisao["grade_selecionada"]
            trabalhador = decisao["trabalha_periodo_integral"]

            resposta_md = "**Sugestão de Grade Horária Semestral Otimizada:**\n\n"
            if trabalhador:
                resposta_md += (
                    "> **Aviso de Mitigação de Viés & Equidade:**\n"
                    "> Identificamos que você trabalha em período integral. Para proteger sua saúde mental, "
                    "prevenir evasão e garantir alto rendimento acadêmico, o algoritmo limitou a grade a no máximo **1 disciplina de Carga Alta**.\n\n"
                )

            resposta_md += "| Dia | Código | Disciplina | Turno | Carga | Créditos |\n"
            resposta_md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
            for d in grade:
                badge_carga = "🔴 Alta" if d["carga_estudo"] == "Alta" else ("🟡 Média" if d["carga_estudo"] == "Média" else "🟢 Baixa")
                resposta_md += f"| {d['dia_semana']} | `{d['codigo']}` | **{d['nome']}** | {d['turno']} | {badge_carga} | {d.get('creditos', 4)} |\n"

            resposta_md += f"\n**Resumo:** {len(grade)} disciplinas recomendadas | Total: {decisao['total_creditos']} créditos.\n\n"

            # Transparência sobre decisões e bloqueios
            if decisao["bloqueadas_sobrecarga_trabalhador"] or decisao["bloqueadas_prereq"] or decisao["bloqueadas_choque"]:
                resposta_md += "#### Transparência Algorítmica (Critérios de Bloqueio):\n"

                if decisao["bloqueadas_sobrecarga_trabalhador"]:
                    for b in decisao["bloqueadas_sobrecarga_trabalhador"]:
                        resposta_md += f"- 🛡️ **{b['disciplina']['codigo']} ({b['disciplina']['nome']}):** Postergada para evitar sobrecarga (já selecionamos {decisao['contador_carga_alta']} disciplina de carga Alta).\n"

                if decisao["bloqueadas_prereq"]:
                    for b in decisao["bloqueadas_prereq"]:
                        resposta_md += f"- 🔒 **{b['disciplina']['codigo']} ({b['disciplina']['nome']}):** Bloqueada por pré-requisito pendente: `{b['prerequisito_pendente']}` ({b['nome_prerequisito']}).\n"

                if decisao["bloqueadas_choque"]:
                    for b in decisao["bloqueadas_choque"]:
                        resposta_md += f"- **{b['disciplina']['codigo']}:** Não alocada por choque de horário com `{b['conflito_com']['codigo']}` ({b['disciplina']['dia_semana']}).\n"

            # Montagem do arquivo grade_sugerida.md para download
            grade_md_export = cls._gerar_arquivo_markdown_grade(decisao, grade, trabalhador)

            # Persistir contagem de simulações
            atualizar_memoria = True
            memoria_longa["historico_simulacoes"] = memoria_longa.get("historico_simulacoes", 0) + 1
            memoria_longa["ultima_atualizacao"] = datetime.now().isoformat()

        elif tipo == "EXIBIR_HISTORICO":
            concluidas = decisao["disciplinas_concluidas"]
            if not concluidas:
                resposta_md = (
                    "**Seu Histórico Acadêmico está vazio.**\n\n"
                    "Você ainda não registrou nenhuma disciplina concluída no GradeBot.\n"
                    "Envie por exemplo: *'Concluí CC101 e CC103'* para registrar seu progresso."
                )
            else:
                resposta_md = f"**Histórico Acadêmico Registrado ({len(concluidas)} disciplinas / {decisao['total_creditos']} créditos):**\n\n"
                for d in concluidas:
                    resposta_md += f"- ✅ **{d['codigo']}** - {d['nome']} ({d['semestre']}º Semestre | Carga: {d['carga_estudo']})\n"

        elif tipo == "EXPLICACAO_ETICA":
            resposta_md = (
                "**Princípios Éticos e Mitigação de Viés no GradeBot**\n\n"
                "Nosso agente conversacional foi projetado sobre 4 pilares éticos fundamentais:\n\n"
                "1. **Privacidade by Design (LGPD - Art. 6º, III):** Não coletamos, não solicitamos e bloqueamos "
                "ativamente CPF, RG ou senhas via Regex na Camada Perceptiva antes de qualquer gravação em disco.\n"
                "2. **Equidade Algorítmica contra o Viés de Otimização Cega:** Tradicionalmente, algoritmos acadêmicos "
                "priorizam a graduação no menor tempo possível, sobrecarregando estudantes que trabalham. "
                "Com o toggle *Estudante Trabalhador*, limitamos disciplinas de carga Alta (máximo 1), reduzindo a evasão e o estresse.\n"
                "3. **Interpretabilidade e Transparência:** Todas as decisões (inclusões, bloqueios de pré-requisitos e choques) "
                "são detalhadas com os exatos critérios matemáticos e lógicos utilizados.\n"
                "4. **Accountability e Supervisão Humana:** O GradeBot é uma ferramenta de apoio à decisão (Decision Support). "
                "A matrícula oficial permanece sob livre-arbítrio e responsabilidade do estudante junto à coordenação da UDF."
            )

        elif tipo == "LISTAR_CATALOGO":
            concluidas_set = set(decisao.get("concluidas", []))
            resposta_md = f"**Catálogo de Disciplinas de Ciência da Computação ({len(decisao['catalogo'])} matérias):**\n\n"
            for d in decisao["catalogo"]:
                status = "✅ Concluída" if d["codigo"] in concluidas_set else "⏳ Pendente"
                prereq_str = f"Pré-req: `{d['prerequisito']}`" if d.get("prerequisito") else "Sem pré-requisito"
                resposta_md += f"- **{d['codigo']}** | **{d['nome']}** ({d['dia_semana']} - {d['turno']}) | `{d['carga_estudo']}` | {prereq_str} | *[{status}]*\n"

        elif tipo == "CONFIRMAR_LIMPEZA_MEMORIA":
            atualizar_memoria = True
            memoria_longa["disciplinas_concluidas"] = []
            memoria_longa["historico_simulacoes"] = 0
            memoria_longa["total_creditos_concluidos"] = 0
            memoria_longa["ultima_atualizacao"] = datetime.now().isoformat()
            resposta_md = (
                "**Memória Acadêmica Resetada com Sucesso!**\n\n"
                "Todas as disciplinas concluídas foram removidas do arquivo `memoria_aluno.json`. "
                "Seu histórico está limpo para iniciar um novo planejamento."
            )

        elif tipo == "TODAS_CONCLUIDAS":
            resposta_md = decisao["mensagem"]

        elif tipo == "ERRO_ENTIDADE":
            resposta_md = f"⚠️ {decisao['mensagem']}"

        else: # MENSAGEM_AJUDA
            resposta_md = (
                "**Olá! Eu sou o GradeBot, seu Agente Conversacional Acadêmico.**\n\n"
                "Fui projetado para ajudá-lo a planejar sua trajetória em **Ciência da Computação** de forma ética, "
                "prevenindo choques de horário e mitigando a sobrecarga de estudos.\n\n"
                "**Comandos que você pode testar em linguagem natural:**\n"
                "- **Registrar matérias já cursadas:** *'Concluí CC101 e CC103'* ou *'Já fiz Algoritmos e Cálculo 1'*\n"
                "- **Montar sua grade semestral:** *'Monte minha grade'* ou *'Quais matérias devo cursar?'*\n"
                "- **Consultar pré-requisitos:** *'Qual o pré-requisito de Inteligência Artificial?'* ou *'Posso fazer CC201?'*\n"
                "- **Ver seu progresso:** *'Ver meu histórico'* ou *'Quais disciplinas já concluí?'*\n"
                "- **Consultar catálogo:** *'Listar disciplinas disponíveis'*\n"
                "- **Auditar critérios éticos:** *'Como funciona a mitigação de viés?'* ou *'Critérios éticos do agente'*\n"
                "- **Resetar histórico:** *'Limpar histórico'* para recomeçar.\n\n"
                "🛡️ *Nota de Privacidade:* Não envie CPFs, RGs ou senhas. Nosso sistema bloqueia preventivamente qualquer PII."
            )

        # Salvar em disco se houver atualização de memória longa
        if atualizar_memoria and memoria_path:
            try:
                with open(memoria_path, "w", encoding="utf-8") as f:
                    json.dump(memoria_longa, f, indent=2, ensure_ascii=False)
            except Exception as e:
                resposta_md += f"\n\n*(Aviso técnico: não foi possível salvar em disco: {e})*"

        return {
            "resposta_texto": resposta_md,
            "grade_md_export": grade_md_export,
            "grade_selecionada": decisao.get("grade_selecionada") if tipo == "GRADE_GERADA" else None,
            "memoria_atualizada": memoria_longa,
            "log_execucao": f"Camada Executiva finalizada com sucesso. Tipo: {tipo}."
        }

    @classmethod
    def _gerar_arquivo_markdown_grade(cls, decisao: Dict[str, Any], grade: List[Dict[str, Any]], trabalhador: bool) -> str:
        """Gera o arquivo grade_sugerida.md com o cronograma final."""
        data_hora = datetime.now().strftime("%d/%m/%Y às %H:%M:%S")
        md = f"""# UDF - Centro Universitário do Distrito Federal
## Curso de Bacharelado em Ciência da Computação
### Cronograma Semestral Sugerido pelo GradeBot

- **Data da Simulação:** {data_hora}
- **Perfil do Estudante:** {"Trabalhador em Período Integral (Carga Equilibrada)" if trabalhador else "Dedicação Padrão"}
- **Total de Disciplinas Recomendadas:** {len(grade)}
- **Total de Créditos:** {decisao['total_creditos']} créditos

---

### Horário Semanal das Disciplinas

| Dia da Semana | Código | Disciplina | Turno | Horário | Carga de Estudo | Créditos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
"""
        for d in grade:
            md += f"| {d['dia_semana']} | {d['codigo']} | {d['nome']} | {d['turno']} | {d.get('horario', '19:00 - 22:30')} | {d['carga_estudo']} | {d.get('creditos', 4)} |\n"

        md += "\n---\n\n### Fundamentação Ética e Critérios de Decisão\n\n"
        if trabalhador:
            md += (
                "- **Mitigação Ativa de Evasão:** Como o estudante trabalha em período integral, foi aplicada a diretriz "
                "de equidade limitando a no máximo 1 disciplina de Carga Alta (ex: Algoritmos ou Cálculo), reduzindo o estresse cognitivo.\n"
            )
        md += (
            "- **Validação Estrita de Pré-Requisitos:** Nenhuma disciplina foi alocada sem que seus pré-requisitos formais estivessem concluídos.\n"
            "- **Prevenção de Choques de Horário:** Não existem duas disciplinas agendadas no mesmo dia da semana e turno.\n"
            "- **Supervisão Humana (Accountability):** Este cronograma é uma proposta automatizada gerada pelo GradeBot. "
            "A validação final de matrícula deve ser homologada pelo estudante no portal acadêmico oficial da UDF.\n"
        )

        return md


class GradeBotAgent:
    """
    Orquestrador Central do Agente Conversacional GradeBot.
    Integra as 4 Camadas de IA com gestão unificada de memória.
    """

    def __init__(self, catalogo_path: str = "catalogo_udf.json", memoria_path: str = "memoria_aluno.json"):
        self.catalogo_path = catalogo_path
        self.memoria_path = memoria_path
        self.catalogo = self._carregar_catalogo()
        self.memoria_longa = self._carregar_memoria()

    def _carregar_catalogo(self) -> List[Dict[str, Any]]:
        """Carrega a base de conhecimento local de disciplinas."""
        if os.path.exists(self.catalogo_path):
            with open(self.catalogo_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def _carregar_memoria(self) -> Dict[str, Any]:
        """Carrega a memória persistente de longo prazo do aluno."""
        if os.path.exists(self.memoria_path):
            try:
                with open(self.memoria_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "aluno_id": "UDF-2026-CC",
            "nome_preferencia": "Estudante UDF",
            "trabalha_periodo_integral": False,
            "disciplinas_concluidas": [],
            "ultima_atualizacao": datetime.now().isoformat(),
            "total_creditos_concluidos": 0,
            "historico_simulacoes": 0
        }

    def processar_mensagem(
        self,
        texto_usuario: str,
        trabalha_periodo_integral: bool = False
    ) -> Dict[str, Any]:
        """
        Executa o fluxo completo do Agente através das 4 Camadas:
        1. Camada Perceptiva (Filtro LGPD & Limpeza)
        2. Camada Cognitiva (Intenção & Entidades)
        3. Camada Decisória (Regras, Pré-requisitos & Equidade)
        4. Camada Executiva (Formatação, Persistência & Exportação)
        """
        logs_camadas = {}

        # ---------------- CAMADA 1: PERCEPTIVA ----------------
        res_perceptiva = PerceptiveLayer.processar(texto_usuario)
        logs_camadas["1_perceptiva"] = res_perceptiva["log_percepcao"]

        # Se violou LGPD, interrompe imediatamente o fluxo sem passar pelas outras camadas
        if not res_perceptiva["aprovado"]:
            logs_camadas["2_cognitiva"] = "Ignorada (Bloqueio preventivo LGPD na Camada 1)."
            logs_camadas["3_decisoria"] = "Ignorada (Nenhum dado sensível processado)."
            logs_camadas["4_executiva"] = "Executado retorno de alerta educativo sobre privacidade."

            return {
                "sucesso": False,
                "bloqueio_lgpd": True,
                "intencao": "BLOQUEIO_LGPD",
                "resposta_texto": res_perceptiva["mensagem_resposta"],
                "grade_md": None,
                "grade_selecionada": None,
                "logs_camadas": logs_camadas,
                "memoria_longa": self.memoria_longa
            }

        texto_limpo = res_perceptiva["texto_higienizado"]

        # ---------------- CAMADA 2: COGNITIVA ----------------
        res_cognitiva = CognitiveLayer.processar(texto_limpo, self.catalogo)
        logs_camadas["2_cognitiva"] = res_cognitiva["log_cognitivo"]

        # ---------------- CAMADA 3: DECISÓRIA ----------------
        res_decisoria = DecisionalLayer.deliberar(
            intencao=res_cognitiva["intencao"],
            disciplinas_mencionadas=res_cognitiva["disciplinas_mencionadas"],
            catalogo=self.catalogo,
            memoria_longa=self.memoria_longa,
            trabalha_periodo_integral=trabalha_periodo_integral
        )
        logs_camadas["3_decisoria"] = res_decisoria["log_decisao"]

        # ---------------- CAMADA 4: EXECUTIVA ----------------
        res_executiva = ExecutiveLayer.executar(
            decisao=res_decisoria,
            memoria_path=self.memoria_path,
            memoria_longa=self.memoria_longa,
            catalogo=self.catalogo
        )
        logs_camadas["4_executiva"] = res_executiva["log_execucao"]

        # Se foi gerado arquivo grade_sugerida.md, salvar cópia local junto à memória
        if res_executiva["grade_md_export"]:
            try:
                base_dir = os.path.dirname(os.path.abspath(self.memoria_path)) if self.memoria_path else "."
                grade_file_path = os.path.join(base_dir, "grade_sugerida.md")
                with open(grade_file_path, "w", encoding="utf-8") as f:
                    f.write(res_executiva["grade_md_export"])
            except Exception:
                pass

        return {
            "sucesso": True,
            "bloqueio_lgpd": False,
            "intencao": res_cognitiva["intencao"],
            "resposta_texto": res_executiva["resposta_texto"],
            "grade_md": res_executiva["grade_md_export"],
            "grade_selecionada": res_executiva["grade_selecionada"],
            "logs_camadas": logs_camadas,
            "memoria_longa": self.memoria_longa
        }
