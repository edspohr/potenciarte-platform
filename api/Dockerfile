# Base image
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Note: Prisma folder removed as per Firestore migration

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Copy service account for Firebase Admin SDK
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
