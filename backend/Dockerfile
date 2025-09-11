FROM node:20-alpine

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json .
COPY tsconfig*.json .
COPY eslint.config.mjs .
COPY jest.config.mjs .

RUN npm install

COPY . .

EXPOSE 10000

CMD [ "npm", "run", "dev" ]