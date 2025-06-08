# backend/src/routes/opportunity_routes.py

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from ..models import OportunidadeONG, OportunidadeUpdate # Certifique-se que OportunidadeONG e OportunidadeUpdate têm 'tipo_acao'
from ..database import get_connection

# Define o roteador para oportunidades.
router = APIRouter(
    prefix="/oportunidades",
    tags=["Oportunidades"]
)

# =========================================================
# Endpoints de Oportunidades
# =========================================================

@router.get("/") # Rota espera '/oportunidades/'
async def consultar_oportunidades():
    """
    Endpoint GET para listar todas as oportunidades.
    CORRIGIDO: Agora seleciona o tipo_acao.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, data_pub, titulo, descricao, ong_id, ong_nome, endereco, data_atuacao, carga_horaria, perfil_voluntario, num_vagas, status_vaga, tipo_acao FROM oportunidades")
            return cursor.fetchall()
    except Exception as e:
        print(f"DEBUG BACKEND: Erro ao consultar oportunidades: {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()

@router.get("/{oportunidade_id}/") # Rota espera '/oportunidades/{id}/'
async def consultar_oportunidade(oportunidade_id: int):
    """
    Endpoint GET para recuperar uma única oportunidade.
    CORRIGIDO: Também adiciona tipo_acao para consulta por ID.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, data_pub, titulo, descricao, ong_id, ong_nome, endereco, data_atuacao, carga_horaria, perfil_voluntario, num_vagas, status_vaga, tipo_acao FROM oportunidades WHERE id = %s", (oportunidade_id,))
            resultado = cursor.fetchone()
            if not resultado:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
            return resultado
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"DEBUG BACKEND: Erro ao consultar oportunidade por ID: {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()

@router.post("/") # Rota espera '/oportunidades/'
async def criar_oportunidade(dados: OportunidadeONG):
    """
    Endpoint POST para criar uma nova oportunidade.
    CORRIGIDO: Lógica para obter ong_id para evitar SyntaxError.
    CORRIGIDO: Insere tipo_acao no banco de dados.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Insere ou atualiza a ONG e tenta pegar o ID
            cursor.execute(
                "INSERT INTO ongs (nome, endereco) VALUES (%s, %s) "
                "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), nome = VALUES(nome)", # Use VALUES(nome) para evitar erro no MySQL 8+
                (dados.ong_nome, dados.endereco)
            )
            ong_id = cursor.lastrowid # Tenta pegar o ID da última inserção

            # Se a ONG já existia e não foi inserida agora, precisamos buscar o ID dela
            if not ong_id:
                cursor.execute("SELECT id FROM ongs WHERE nome = %s", (dados.ong_nome,))
                existing_ong = cursor.fetchone()
                if existing_ong:
                    ong_id = existing_ong['id']
                else:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno: Não foi possível obter ID da ONG.")

            # Insere a oportunidade AGORA COM 'tipo_acao'
            cursor.execute(
                """INSERT INTO oportunidades
                (titulo, descricao, ong_id, ong_nome, endereco, data_atuacao, carga_horaria, perfil_voluntario, num_vagas, status_vaga, tipo_acao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", # 11 %s agora
                (
                    dados.titulo, dados.descricao, ong_id, dados.ong_nome, dados.endereco,
                    dados.data_atuacao, dados.carga_horaria, dados.perfil_voluntario,
                    dados.num_vagas, dados.status_vaga, dados.tipo_acao # <<--- ADICIONADO: dados.tipo_acao
                )
            )
            conn.commit()
            return {"success": True, "id": cursor.lastrowid}
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"DEBUG BACKEND: Erro ao criar oportunidade: {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()

@router.put("/{oportunidade_id}/") # Rota espera '/oportunidades/{id}/'
async def atualizar_oportunidade_completa(oportunidade_id: int, dados: OportunidadeONG):
    """
    Endpoint PUT para atualizar oportunidade completa.
    CORRIGIDO: Inclui tipo_acao no UPDATE.
    """
    print(f"DEBUG BACKEND: Recebido PUT para oportunidade_id: {oportunidade_id}")
    print(f"DEBUG BACKEND: Dados recebidos: {dados.dict()}")

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # CORRIGIDO: Inclui tipo_acao no UPDATE
            cursor.execute(
                """UPDATE oportunidades SET
                titulo = %s, descricao = %s, ong_nome = %s, endereco = %s,
                data_atuacao = %s, carga_horaria = %s, perfil_voluntario = %s,
                num_vagas = %s, status_vaga = %s, tipo_acao = %s
                WHERE id = %s""", # 11 campos a atualizar agora
                (
                    dados.titulo, dados.descricao, dados.ong_nome, dados.endereco,
                    dados.data_atuacao, dados.carga_horaria, dados.perfil_voluntario,
                    dados.num_vagas, dados.status_vaga, dados.tipo_acao, # <<--- ADICIONADO: dados.tipo_acao
                    oportunidade_id
                )
            )
            print(f"DEBUG BACKEND: cursor.rowcount após UPDATE: {cursor.rowcount}")
            if cursor.rowcount == 0:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
            conn.commit()
            return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"DEBUG BACKEND: Erro ao atualizar oportunidade (PUT): {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()

@router.patch("/{oportunidade_id}/") # Rota espera '/oportunidades/{id}/'
async def atualizar_oportunidade_parcial(oportunidade_id: int, dados: OportunidadeUpdate):
    """
    Endpoint PATCH para atualizar oportunidade parcial.
    CORRIGIDO: 'tipo_acao' agora PODE ser atualizado.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM oportunidades WHERE id = %s", (oportunidade_id,))
            oportunidade_existente = cursor.fetchone()
            if not oportunidade_existente:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")

            updates = {k: v for k, v in dados.dict(exclude_unset=True).items()}
            if not updates:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhum campo para atualizar")

            set_clauses = []
            values = []
            for field, value in updates.items():
                # CORRIGIDO: REMOVIDO 'if field not in ['tipo_acao']', AGORA tipo_acao PODE SER ATUALIZADO
                set_clauses.append(f"{field} = %s")
                values.append(value)
            
            query = f"UPDATE oportunidades SET {', '.join(set_clauses)} WHERE id = %s"
            values.append(oportunidade_id)

            print(f"DEBUG BACKEND PATCH: Query gerada: {query}")
            print(f"DEBUG BACKEND PATCH: Valores para query: {tuple(values)}")
            cursor.execute(query, tuple(values))
            conn.commit()
            return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"DEBUG BACKEND: Erro ao atualizar oportunidade (PATCH): {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()

@router.delete("/{oportunidade_id}/", status_code=status.HTTP_204_NO_CONTENT) # Rota espera '/oportunidades/{id}/'
async def deletar_oportunidade(oportunidade_id: int):
    """
    Endpoint DELETE para deletar oportunidade.
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM oportunidades WHERE id = %s", (oportunidade_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
            conn.commit()
            return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"DEBUG BACKEND: Erro ao deletar oportunidade: {e}")
        return JSONResponse({"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        if conn:
            conn.close()