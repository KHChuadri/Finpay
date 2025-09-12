FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./

# Install ALL dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app with debug output
RUN npm run build && ls -la dist/

# Force install Express v4
RUN npm install express@4.18.2

CMD ["node", "server.js"]