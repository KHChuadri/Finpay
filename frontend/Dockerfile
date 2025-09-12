FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev deps needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app (now tsc will be available)
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Serve the built static files
CMD ["serve", "-s", "dist", "-l", "$PORT"]