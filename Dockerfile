ARG MONOREPO_BUILD_VERSION=latest
FROM celo-monorepo-build-base:$MONOREPO_BUILD_VERSION

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN yarn nest build onboarding
RUN yarn nest build relayer