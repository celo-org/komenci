FROM node:10

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN yarn run build:komencikit
RUN yarn nest build onboarding
RUN yarn nest build relayer