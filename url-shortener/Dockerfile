FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl procps

# USER node

WORKDIR /home/node/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npm install -g nodemon

COPY . .

# Change ownership of the app directory
RUN chown -R node:node /home/node/app

# Use a non-root user
USER node

CMD ["nodemon", "--watch", "src", "--exec", "npm", "run", "start:dev"]