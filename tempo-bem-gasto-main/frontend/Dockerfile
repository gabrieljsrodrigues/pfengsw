# ───────────────────────────────────────────────────────────────────────────────
#   Etapa 1: Serve os arquivos estáticos com Nginx (AGORA RECEBENDO O BUILD LOCAL)
# ───────────────────────────────────────────────────────────────────────────────
FROM nginx:stable-alpine

# Define diretório de trabalho (opcional, mas bom ter)
WORKDIR /usr/share/nginx/html

# Remove qualquer conteúdo default do /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos gerados LOCALMENTE para onde o Nginx espera
# ATENÇÃO: ESTE COMANDO AGORA ESPERA QUE VOCÊ JÁ TENHA RODADO 'npm run build' LOCALMENTE
COPY build/ .

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 para servir estático
EXPOSE 80

# Inicia o Nginx (em foreground)
CMD ["nginx", "-g", "daemon off;"]