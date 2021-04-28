FROM node:10

ARG KOMENCI_VERSION
ENV KOMENCI_VERSION=$KOMENCI_VERSION

COPY ./package.json .
COPY ./yarn.lock .

RUN SKIPPOSTINSTALL=1 yarn

COPY . .

# Second `yarn` needed to:
# - Build `libs/komencikit`
# - Setup `libs/komencikit` as an npm workspace and link it
RUN yarn 
RUN yarn nest build onboarding
RUN yarn nest build relayer 