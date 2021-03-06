#stage 1 - Build
FROM node:10.15 AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./src ./src
COPY ./angular.json ./
COPY ./ts*.json ./

RUN npm run postinstall

#stage 2 - Production
FROM node:8.9-alpine AS production

WORKDIR /app

COPY ./api/package*.json ./

RUN npm install --only=production

COPY --from=base ./app/dist ./dist
COPY ./api ./api

EXPOSE 8000

CMD ["node", "api/server.js"]
