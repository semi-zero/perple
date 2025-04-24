FROM node:20.18.0-alpine

WORKDIR /home/perplexica

COPY ui/package.json /home/perplexica/
COPY ui/yarn.lock /home/perplexica/

RUN yarn install --frozen-lockfile