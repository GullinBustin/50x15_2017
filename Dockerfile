FROM node:9.5


WORKDIR /usr/src/50x15

COPY ./package.json .
RUN npm install --only=production

COPY ./app.js .
COPY ./bin/ ./bin
COPY ./modules ./modules
COPY ./public ./public
COPY ./routes ./routes
COPY ./services ./services
COPY ./views ./views


CMD [ "npm", "start" ]
