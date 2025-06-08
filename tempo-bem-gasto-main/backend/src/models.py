# backend/src/models.py

from pydantic import BaseModel, Field
from typing import Optional

class DadosInscricao(BaseModel):
    nome: str
    nascimento: str
    cpf: str
    mensagem: str
    oportunidade_id: int

# Modelo de Oportunidade (AGORA COM 'tipo_acao')
class OportunidadeONG(BaseModel):
    id: Optional[int] = None # Adicionar id opcional para quando a vaga já existe
    titulo: str
    descricao: str
    ong_nome: str
    endereco: str
    data_atuacao: Optional[str] = None
    carga_horaria: Optional[str] = None
    perfil_voluntario: Optional[str] = None
    num_vagas: Optional[int] = None
    status_vaga: str = Field("ativa", pattern="^(ativa|inativa|encerrada|em_edicao)$")
    tipo_acao: str # <<--- ADICIONADO: O campo 'tipo_acao' agora faz parte do modelo
    data_pub: Optional[str] = None # Adicionado para garantir que o retorno do GET tenha data_pub

# Modelo para Edição Parcial de Oportunidade (AGORA COM 'tipo_acao')
class OportunidadeUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    endereco: Optional[str] = None
    data_atuacao: Optional[str] = None
    carga_horaria: Optional[str] = None
    perfil_voluntario: Optional[str] = None
    num_vagas: Optional[int] = None
    status_vaga: Optional[str] = Field(None, pattern="^(ativa|inativa|encerrada|em_edicao)$")
    tipo_acao: Optional[str] = None # <<--- ADICIONADO: O campo 'tipo_acao' agora faz parte do modelo para updates