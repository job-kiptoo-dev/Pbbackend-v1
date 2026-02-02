# Use Node.js LTS image
FROM node:lts-alpine
# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 8000

# For development with hot reload
CMD ["npm", "run", "dev"]
