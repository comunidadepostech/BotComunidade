# Build
FROM node:22.20.0-alpine
WORKDIR ./bot
COPY package.json package-lock.json ./
COPY . .
RUN npm install