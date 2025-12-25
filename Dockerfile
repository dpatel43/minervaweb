# ------------------------
# Build Angular App
# ------------------------
FROM node:22.12 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --prod

# ------------------------
# NGINX Web Server
# ------------------------
FROM nginx:alpine

# Copy built Angular app
COPY --from=build /app/dist/minervaweb /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/share/nginx/html/

# Replace env.js at runtime
ENTRYPOINT ["sh", "/usr/share/nginx/html/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
