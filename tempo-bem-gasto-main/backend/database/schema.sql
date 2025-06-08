-- ===================================================================
-- 1) Criação do banco / uso do banco
-- ===================================================================
CREATE DATABASE IF NOT EXISTS site_voluntariado;
USE site_voluntariado;

-- ===================================================================
-- 2) Tabela de ONGs
-- ===================================================================
CREATE TABLE IF NOT EXISTS ongs (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `nome`       VARCHAR(255) NOT NULL UNIQUE,
    `endereco`   VARCHAR(255)
);

-- ===================================================================
-- 3) Tabela de Oportunidades (AGORA COM 'tipo_acao')
-- ===================================================================
CREATE TABLE IF NOT EXISTS oportunidades (
    `id`                INT AUTO_INCREMENT PRIMARY KEY,
    `data_pub`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `titulo`            VARCHAR(255) NOT NULL,
    `descricao`         TEXT         NOT NULL,
    `ong_id`            INT          NOT NULL,
    `ong_nome`          VARCHAR(255) NOT NULL,
    `endereco`          VARCHAR(255),
    `data_atuacao`      VARCHAR(255),
    `carga_horaria`     VARCHAR(100),
    `perfil_voluntario` TEXT,
    `num_vagas`         INT          DEFAULT NULL,
    `status_vaga`       ENUM('ativa', 'inativa', 'encerrada', 'em_edicao') DEFAULT 'ativa',
    `tipo_acao`         VARCHAR(255), -- <<--- ADICIONADO: Nova coluna para o tipo de ação. Use VARCHAR para flexibilidade com o ENUM do frontend.

    FOREIGN KEY (`ong_id`) REFERENCES ongs(`id`) ON DELETE CASCADE
);

-- Para adicionar a coluna 'tipo_acao' em um banco de dados já existente:
-- ALERTA: Execute o comando abaixo APENAS SE A TABELA 'oportunidades' JÁ EXISTIR NO SEU BANCO DE DADOS
-- E SE A COLUNA 'tipo_acao' AINDA NÃO ESTIVER LÁ.
-- Se você estiver recriando o banco do zero (com um 'docker system prune -a --volumes'), a linha acima 'CREATE TABLE' já cria.
ALTER TABLE oportunidades ADD COLUMN tipo_acao VARCHAR(255) AFTER status_vaga;


-- ===================================================================
-- 4) Tabela de Voluntários
-- ===================================================================
CREATE TABLE IF NOT EXISTS voluntarios (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `nome`          VARCHAR(255) NOT NULL,
    `nascimento`    DATE         NOT NULL,
    `cpf`           VARCHAR(14)  NOT NULL UNIQUE,
    `mensagem`      TEXT,
    `data_cadastro` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 5) Tabela de Inscrições
-- ===================================================================
CREATE TABLE IF NOT EXISTS inscricoes (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `voluntario_id`  INT          NOT NULL,
    `oportunidade_id` INT          NOT NULL,
    `data_inscricao` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `status`         ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',

    FOREIGN KEY (`voluntario_id`) REFERENCES voluntarios(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`oportunidade_id`) REFERENCES oportunidades(`id`) ON DELETE CASCADE,
    UNIQUE (`voluntario_id`, `oportunidade_id`)
);

-- ===================================================================
-- 6) Dados de exemplo para testes iniciais
-- ===================================================================
INSERT INTO ongs (nome, endereco)
VALUES ('Teste ONG', 'Rua Exemplo, 123')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

INSERT INTO voluntarios (nome, nascimento, cpf, mensagem)
VALUES (
    'TESTE DE OLIVEIRA DA SILVA',
    '1967-02-19',
    '11122233344',
    'Eu sou TESTE'
);

INSERT INTO inscricoes (voluntario_id, oportunidade_id)
VALUES (1, 1);