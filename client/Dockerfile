FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["npm", "start"]
