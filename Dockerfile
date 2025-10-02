# Build
FROM node:20.18.1
WORKDIR ./bot
COPY package.json package-lock.json ./
RUN npm install
COPY . .
