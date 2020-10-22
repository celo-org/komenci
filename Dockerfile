FROM node:10

RUN apt update -y && apt install -y \
      bash\
      g++\
      gcc\
      git\
      libsecret-1-dev\
      libusb-1.0-0\
      make\
      python

RUN alias python='/usr/bin/python3'

RUN mkdir /app
WORKDIR /app

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN git submodule update --init
RUN yarn deps:celo:install || true
RUN yarn deps:celo:build

ARG SERVICE
ENV _SERVICE=$SERVICE

ENV PORT 3000

RUN yarn run build $SERVICE
CMD node dist/apps/$_SERVICE/main | npx pino-pretty


