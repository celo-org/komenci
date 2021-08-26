FROM node:10 as builder

RUN mkdir /komenci
WORKDIR /komenci

COPY . .


RUN SKIPPOSTINSTALL=1 yarn
RUN yarn build

FROM node:10 as release

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

RUN mkdir /komenci
WORKDIR /komenci

COPY --from=builder /komenci/packages ./packages
COPY --from=builder /komenci/package.json ./package.json
COPY --from=builder /komenci/yarn.lock ./yarn.lock

RUN SKIPPOSTINSTALL=1 yarn install --prod