"""Mini-Projeto: API de Consulta de CEP (Desafio Prático - Nível Avançado).

Disciplina: Tendências em Ciência da Computação (Unidade II)
Instituição: Centro Universitário UDF
"""

import json
import urllib.error
import urllib.request


def sanitizar_cep(cep: str) -> str:
    """Remove caracteres não numéricos e valida o tamanho de 8 dígitos do CEP."""
    if not isinstance(cep, str):
        raise TypeError("O CEP deve ser informado como texto (string).")

    apenas_digitos = "".join(caractere for caractere in cep if caractere.isdigit())
    if len(apenas_digitos) != 8:
        raise ValueError("CEP inválido: informe exatamente 8 dígitos numéricos.")

    return apenas_digitos


def consultar_cep(cep: str, timeout: int = 5) -> dict[str, str]:
    """Consulta os dados de endereço de um CEP brasileiro via API pública ViaCEP.

    Args:
        cep: CEP com 8 dígitos (com ou sem hífen).
        timeout: Tempo limite da requisição HTTP em segundos.

    Returns:
        Dicionário estruturado com os campos principais do endereço.

    Raises:
        ValueError: Se o CEP tiver formato inválido ou não for encontrado.
        ConnectionError: Se houver falha de rede ou indisponibilidade da API.
    """
    cep_limpo = sanitizar_cep(cep)
    url = f"https://viacep.com.br/ws/{cep_limpo}/json/"

    try:
        with urllib.request.urlopen(url, timeout=timeout) as resposta:
            conteudo = resposta.read().decode("utf-8")
            dados = json.loads(conteudo)
    except urllib.error.URLError as erro:
        raise ConnectionError(f"Falha ao conectar à API de CEP: {erro.reason}") from erro
    except json.JSONDecodeError as erro:
        raise ValueError("Resposta inválida recebida do servidor.") from erro

    if dados.get("erro"):
        raise ValueError(f"CEP {cep_limpo} não encontrado na base de dados.")

    # Uso seguro de .get() evita KeyError caso campos opcionais venham ausentes
    return {
        "cep": dados.get("cep", cep_limpo),
        "logradouro": dados.get("logradouro") or "Não informado",
        "bairro": dados.get("bairro") or "Não informado",
        "cidade": dados.get("localidade") or "Não informado",
        "uf": dados.get("uf") or "Não informado",
    }


def exibir_endereco(endereco: dict[str, str]) -> None:
    """Exibe os dados formatados do endereço no terminal."""
    print("=== Resultado da Consulta de CEP ===")
    print(f"CEP       : {endereco['cep']}")
    print(f"Logradouro: {endereco['logradouro']}")
    print(f"Bairro    : {endereco['bairro']}")
    print(f"Cidade/UF : {endereco['cidade']} - {endereco['uf']}")


if __name__ == "__main__":
    cep_teste = "70390-045"  # Exemplo em Brasília - DF
    try:
        resultado = consultar_cep(cep_teste)
        exibir_endereco(resultado)
    except (ValueError, ConnectionError) as falha:
        print(f"Erro na consulta: {falha}")
