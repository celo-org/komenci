FROM node:10

RUN mkdir /app
WORKDIR /app

COPY ./package.json .
COPY ./yarn.lock .
RUN yarn

COPY . .

ARG SERVICE
ENV _SERVICE=$SERVICE
ENV PORT 3000

RUN yarn run build $SERVICE
CMD node dist/apps/$_SERVICE/main | npx pino-pretty


