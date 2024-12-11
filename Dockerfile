FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código
COPY . .

# Compilar el código
RUN npm run build

EXPOSE 4000

# Comando por defecto
CMD ["npm", "run", "start:dev"]
