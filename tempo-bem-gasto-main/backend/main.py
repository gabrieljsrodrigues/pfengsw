import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pymysql
import pymysql.cursors

load_dotenv()  # Carrega variáveis do arquivo .env (se existir)

api = FastAPI()

# Permitir CORS de todos os domínios (ajuste em produção para seu domínio correto)
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validar_variaveis_ambiente():
    required_vars = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]
    for var in required_vars:
        if not os.getenv(var):
            raise Exception(f"Variável de ambiente {var} não definida")

def get_connection():
    """
    Retorna uma conexão pymysql usando DictCursor para que 
    cursor.fetchall() e cursor.fetchone() devolvam dicts.
    """
    validar_variaveis_ambiente()
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor  # Retorna dicts em vez de tuplas
    )
    return conn

# =========================================================
# Models Pydantic
# =========================================================
class DadosInscricao(BaseModel):
    nome: str
    nascimento: str
    cpf: str
    mensagem: str
    oportunidade_id: int

class OportunidadeONG(BaseModel):
    titulo: str
    descricao: str
    ong_nome: str
    endereco: str

# =========================================================
# Endpoints do FastAPI (Backend)
# =========================================================

@api.get("/oportunidades")
async def consultar_oportunidades():
    """
    Lista todas as oportunidades cadastradas.
    Retorna JSON com objetos contendo:
     - id, data_pub, titulo, descricao, ong_id, ong_nome
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM oportunidades")
            return cursor.fetchall()
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/oportunidades/{oportunidade_id}")
async def consultar_oportunidade(oportunidade_id: int):
    """
    Recupera uma única oportunidade pelo {oportunidade_id}.
    Se não encontrar, retorna HTTP 404.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM oportunidades WHERE id = %s", (oportunidade_id,))
            resultado = cursor.fetchone()
            if not resultado:
                raise HTTPException(status_code=404, detail="Oportunidade não encontrada")
            return resultado
    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.post("/ongs/oportunidades")
async def criar_oportunidade(dados: OportunidadeONG):
    """
    Cria/obtém uma ONG e publica uma nova oportunidade associada a ela.
    Corpo JSON esperado:
    {
      "titulo": "Título da Oportunidade",
      "descricao": "Descrição detalhada",
      "ong_nome": "Nome da ONG",
      "endereco": "Endereço da ONG"
    }
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 1) Insere ou obtém o ID da ONG (por causa do UNIQUE(nome))
            cursor.execute(
                "INSERT INTO ongs (nome, endereco) VALUES (%s, %s) "
                "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
                (dados.ong_nome, dados.endereco)
            )
            # 2) Insere a oportunidade vinculada ao ID retornado
            cursor.execute(
                "INSERT INTO oportunidades "
                "(titulo, descricao, ong_id, ong_nome) "
                "VALUES (%s, %s, LAST_INSERT_ID(), %s)",
                (dados.titulo, dados.descricao, dados.ong_nome)
            )
            conn.commit()
            return {"success": True}
    except Exception as e:
        if conn:
            conn.rollback()
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/ongs/{ong_id}/inscricoes")
async def consultar_inscricoes_por_ong(ong_id: int):
    """
    Retorna todas as inscrições (candidatos) para as oportunidades dessa ONG.
    Faz join entre inscricoes i e oportunidades o, filtrando por o.ong_id = ong_id.
    Cada resultado contém:
    - inscricao_id
    - voluntario_id, voluntario_nome
    - oportunidade_id, oportunidade_titulo
    - data_inscricao, status
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    i.id               AS inscricao_id,
                    i.voluntario_id,
                    v.nome             AS voluntario_nome,
                    i.oportunidade_id,
                    o.titulo           AS oportunidade_titulo,
                    i.data_inscricao,
                    i.status
                FROM inscricoes i
                JOIN oportunidades o ON i.oportunidade_id = o.id
                JOIN voluntarios v ON i.voluntario_id = v.id
                WHERE o.ong_id = %s
                ORDER BY i.data_inscricao DESC
            """
            cursor.execute(sql, (ong_id,))
            return cursor.fetchall()
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/inscricoes")
async def consultar_inscricoes():
    """
    Lista todas as inscrições de todos os voluntários em todas as oportunidades.
    Cada objeto contém:
    - inscricao_id, voluntario_id, voluntario_nome, oportunidade_id, data_inscricao, status
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    i.id               AS inscricao_id,
                    i.voluntario_id,
                    v.nome             AS voluntario_nome,
                    i.oportunidade_id,
                    i.data_inscricao,
                    i.status
                FROM inscricoes i
                JOIN voluntarios v ON i.voluntario_id = v.id
                ORDER BY i.data_inscricao DESC
            """)
            return cursor.fetchall()
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/voluntarios")
async def consultar_voluntarios():
    """
    Lista todos os voluntários cadastrados.
    Cada objeto contém: id, nome, nascimento, cpf, mensagem
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM voluntarios")
            return cursor.fetchall()
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/voluntarios/{voluntario_id}")
async def consultar_voluntario(voluntario_id: int):
    """
    Retorna um único voluntário pelo ID. Se não existir, retorna 404.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM voluntarios WHERE id = %s", (voluntario_id,))
            resultado = cursor.fetchone()
            if not resultado:
                raise HTTPException(status_code=404, detail="Voluntário não encontrado")
            return resultado
    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.post("/inscricoes")
async def salvar_inscricao(dados: DadosInscricao):
    conn = None
    try:
        # Normalizar o CPF
        cpf = dados.cpf.strip().replace(".", "").replace("-", "")
        if len(cpf) > 11:
            cpf = "00000000000"  # Padrão se CPF inválido

        conn = get_connection()
        with conn.cursor() as cursor:
            # 1) Checar se voluntário já existe pelo CPF
            cursor.execute(
                "SELECT id FROM voluntarios WHERE cpf = %s",
                (cpf,)
            )
            result = cursor.fetchone()
            if result:
                voluntario_id = result['id']
            else:
                cursor.execute(
                    "INSERT INTO voluntarios (nome, nascimento, cpf, mensagem) VALUES (%s, %s, %s, %s)",
                    (dados.nome, dados.nascimento, cpf, dados.mensagem)
                )
                voluntario_id = cursor.lastrowid

            # 2) Inserir inscrição (voluntario <-> oportunidade)
            cursor.execute(
                "INSERT INTO inscricoes (voluntario_id, oportunidade_id, status) VALUES (%s, %s, %s)",
                (voluntario_id, dados.oportunidade_id, "pendente")
            )

            conn.commit()
            return {"success": True}

    except Exception as e:
        if conn:
            conn.rollback()
        # Se for duplicidade de CPF, buscar o ID e seguir
        if "Duplicate entry" in str(e) and "for key 'cpf'" in str(e):
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM voluntarios WHERE cpf = %s",
                    (cpf,)
                )
                result = cursor.fetchone()
                if result:
                    voluntario_id = result['id']
                    cursor.execute(
                        "INSERT INTO inscricoes (voluntario_id, oportunidade_id, status) VALUES (%s, %s, %s)",
                        (voluntario_id, dados.oportunidade_id, "pendente")
                    )
                    conn.commit()
                    return {"success": True}
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@api.patch("/inscricoes/{inscricao_id}")
async def atualizar_status(inscricao_id: int, status: str):
    """
    Atualiza apenas o campo 'status' de uma inscrição específica.
    Espera ?status=pendente|aprovado|rejeitado na query string.
    Retorna {"success": true} ou 404/400 conforme o caso.
    """
    if status not in ("pendente", "aprovado", "rejeitado"):
        raise HTTPException(status_code=400, detail="Status inválido")

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE inscricoes SET status = %s WHERE id = %s",
                (status, inscricao_id)
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Inscrição não encontrada")
            conn.commit()
            return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        if conn:
            conn.rollback()
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()

@api.get("/voluntarios/{voluntario_id}/inscricoes")
async def consultar_inscricoes_por_voluntario(voluntario_id: int):
    """
    Retorna todas as inscrições de um voluntário específico.
    Cada resultado contém:
    - inscricao_id
    - oportunidade_id, oportunidade_titulo
    - data_inscricao, status
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    i.id AS inscricao_id,
                    i.oportunidade_id,
                    o.titulo AS oportunidade_titulo,
                    i.data_inscricao,
                    i.status
                FROM inscricoes i
                JOIN oportunidades o ON i.oportunidade_id = o.id
                WHERE i.voluntario_id = %s
                ORDER BY i.data_inscricao DESC
            """, (voluntario_id,))
            return cursor.fetchall()
    except Exception as e:
        return JSONResponse({"error": str(e)}, 500)
    finally:
        if conn:
            conn.close()