# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (needed for compiling)
RUN npm install

# Copy source code
COPY . .

# Build Vite application
RUN npm run build

# Production Stage (Nginx)
FROM nginx:stable-alpine

# Copy built assets from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx configuration to support client-side routing (Vite SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
