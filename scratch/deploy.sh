#!/bin/bash

# GABLIMADOS — Script de Despliegue Automatizado
# Ejecutar en el servidor (/var/www/gablimados)

set -e # Terminar inmediatamente si hay algún error

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

echo -e "${BLUE}=== Iniciando Despliegue de GABLIMADOS ===${NC}"

# 1. Obtener el código más reciente
echo -e "${BLUE}[1/5] Actualizando repositorio git...${NC}"
git pull origin main || echo -e "Advertencia: No se pudo hacer git pull. Se asume que el código ya está actualizado."

# 2. Instalar dependencias
echo -e "${BLUE}[2/5] Instalando dependencias de npm...${NC}"
npm install --production=false

# 3. Aplicar esquema de base de datos
echo -e "${BLUE}[3/5] Aplicando esquema de base de datos con Prisma (db push)...${NC}"
npx prisma db push --accept-data-loss

# 4. Generar cliente Prisma y compilar Next.js
echo -e "${BLUE}[4/5] Generando cliente y compilando la aplicación Next.js...${NC}"
npx prisma generate
npm run build

# 5. Reiniciar o iniciar proceso en PM2
echo -e "${BLUE}[5/5] Registrando e iniciando la aplicación con PM2...${NC}"

# Leer puerto desde el .env (default: 3000)
PORT=$(grep -v '^#' .env | grep -i '^PORT=' | cut -d'=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ' || echo "3000")
PORT=${PORT:-3000}

if pm2 list | grep -q "gablimados"; then
    echo "Reiniciando proceso existente en PM2 en el puerto $PORT..."
    pm2 restart gablimados
else
    echo "Registrando nuevo proceso en PM2 en el puerto $PORT..."
    pm2 start npm --name "gablimados" -- start -- -p $PORT
fi

pm2 save

echo -e "${GREEN}=== ¡Despliegue completado con éxito! ===${NC}"
echo "La aplicación está corriendo en http://localhost:$PORT"
