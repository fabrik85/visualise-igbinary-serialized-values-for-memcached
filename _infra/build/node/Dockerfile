FROM node:14.5-buster-slim
LABEL maintainer="Attila Fabrik, fabrik85@gmail.com"

COPY src /data
WORKDIR /data

RUN npm ci --only=production

EXPOSE 80
CMD ["node", "app.js"]
