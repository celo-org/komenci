FROM node:10

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

COPY ./package.json .
COPY ./yarn.lock .

RUN SKIPPOSTINSTALL=1 yarn

COPY . .

RUN yarn postinstall
RUN yarn nest build onboarding
RUN yarn nest build relayer