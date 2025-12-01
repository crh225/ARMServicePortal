# portal/backend/Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm i

# Copy the rest of the source
COPY . .

# Copy blueprint modules for Terraform code generation
# These are copied from the build context (set in workflow)
COPY modules/ /app/modules/

# Environment
ENV NODE_ENV=production
ENV PORT=4000
ENV MODULES_PATH=/app/modules

EXPOSE 4000

CMD ["node", "src/index.js"]
