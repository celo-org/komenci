FROM node:10 as builder

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

RUN mkdir /komenci
WORKDIR /komenci

COPY . .

RUN yarn install --prod
RUN cp node_modules node_modules_prod
RUN yarn install

RUN yarn build:libs
RUN yarn build:relayer
RUN yarn build:api

FROM node:10 as release

RUN mkdir /komenci
WORKDIR /komenci

COPY --from=builder /komenci/packages ./packages
COPY --from=builder /komenci/package.json ./package.json
COPY --from=builder /komenci/yarn.lock ./yarn.lock
COPY --from=builder /komenci/node_modules_prod ./node_modules
