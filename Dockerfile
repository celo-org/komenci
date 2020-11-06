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
# RUN mkdir -p /app/libs/celo
# RUN mkdir /app/scripts


COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN git submodule update --init
RUN yarn deps:celo:install || true
RUN yarn deps:celo:build

RUN yarn nest build onboarding
RUN yarn nest build relayer

