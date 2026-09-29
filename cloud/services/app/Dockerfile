FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install pg@8.16.3
COPY server.js ./
EXPOSE 3000
CMD ["npm","start"]
