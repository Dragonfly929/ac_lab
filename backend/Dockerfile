FROM node:20-alpine

# Install build tools needed for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create data directory for SQLite db
RUN mkdir -p /data

EXPOSE 3000
CMD ["node", "index.js"]
