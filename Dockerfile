FROM node:18-alpine as builder

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.default.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build .

EXPOSE 80
