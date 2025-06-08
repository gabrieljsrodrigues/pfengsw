# backend/src/database.py

import os
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv() # Garante que as variáveis de ambiente sejam carregadas, mesmo que este módulo seja importado separadamente.

def validar_variaveis_ambiente():
    """
    Verifica se todas as variáveis de ambiente necessárias para a conexão com o banco de dados estão definidas.
    Levanta uma exceção se alguma variável estiver faltando.
    """
    required_vars = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]
    for var in required_vars:
        if not os.getenv(var):
            raise Exception(f"Variável de ambiente {var} não definida")

def get_connection():
    """
    Retorna uma conexão PyMySQL com o banco de dados configurado nas variáveis de ambiente.
    Usa DictCursor para que os resultados das consultas (fetchall, fetchone) sejam dicionários (chave-valor).
    """
    validar_variaveis_ambiente() # Valida as variáveis de ambiente antes de tentar conectar.
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn
