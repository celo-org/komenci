FROM node:10 as builder

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

RUN mkdir /komenci
WORKDIR /komenci

COPY . .

RUN yarn
RUN yarn build:libs
RUN yarn build:relayer
RUN yarn build:api

FROM node:10 as release

RUN mkdir /komenci
WORKDIR /komenci

COPY --from=builder /komenci/packages ./packages
COPY --from=builder /komenci/package.json ./package.json
COPY --from=builder /komenci/yarn.lock ./yarn.lock

RUN yarn install --prod

