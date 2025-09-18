# Imagem base compatível com Oracle Instant Client
FROM node:18-bullseye

# Instala bibliotecas necessárias para o Oracle Instant Client
RUN apt-get update && apt-get install -y \
  libaio1 \
  libnsl-dev \
  libstdc++6 \
  unzip \
  && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /usr/src/app

# Copia bibliotecas Oracle e wallet
COPY instant/ ./instant/
COPY wallet/ ./wallet/

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências de produção
RUN npm install --production

# Copia o restante da aplicação
COPY . .

# Define variáveis de ambiente para Oracle
ENV LD_LIBRARY_PATH=/usr/src/app/instant
ENV TNS_ADMIN=/usr/src/app/wallet

# Expõe a porta usada pelo backend
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "server.js"]

# No final do Dockerfile
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
