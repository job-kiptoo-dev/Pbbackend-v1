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

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port
EXPOSE 10000

# Run compiled production server
CMD ["npm", "start"]
