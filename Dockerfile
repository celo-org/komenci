ARG MONORERPO_BUILD_VERSION=latest
FROM celo-monorepo-build-base:$MONORERPO_BUILD_VERSION

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn

COPY . .

RUN yarn nest build onboarding
RUN yarn nest build relayer