# portal/backend/Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm i
# Copy the rest of the source
COPY . .

# Environment
ENV NODE_ENV=production
# App listens on PORT (App Services / Containers will set this)
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.js"]
