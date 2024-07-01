FROM node:20-slim
RUN npm install -g prisma

RUN mkdir /app
WORKDIR /app

COPY ./ ./prisma/

CMD [ "prisma", "dev"]
