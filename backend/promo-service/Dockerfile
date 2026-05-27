FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 5007
CMD ["node", "src/server.js"]
