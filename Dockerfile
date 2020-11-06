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
RUN mkdir -p /app/libs/celo
RUN mkdir /app/scripts

WORKDIR /app

COPY ./libs/celo/. ./libs/celo/.
COPY ./scripts/. ./scripts/.

# Postinstall fails but we don't care
RUN yarn --cwd ./libs/celo || true
RUN bash ./scripts/build.celo.sh

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN yarn nest build onboarding
RUN yarn nest build relayer
