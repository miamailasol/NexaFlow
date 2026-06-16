FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy backend scripts and environment configuration template
COPY scripts/ ./scripts/

# Expose backend port
EXPOSE 3001

# Command to run the service
CMD ["node", "scripts/circle-dcw-service.js"]
