{%- if values.app_type == 'static' %}
# Static site: Build with Node, serve with nginx
FROM node:${{ values.node_version }}-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage - serve static files with nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
{%- else %}
# Node server: Build and run with Node
FROM node:${{ values.node_version }}-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the app (if needed)
RUN npm run build || echo "No build step"

# Production stage
FROM node:${{ values.node_version }}-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --only=production

# Copy built app from builder
COPY --from=builder /app/src ./src

# Copy package.json (already copied above, but ensures consistency)
COPY --from=builder /app/package.json ./

EXPOSE ${{ values.port }}

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${{ values.port }}/health || exit 1

CMD ["npm", "start"]
{%- endif %}
