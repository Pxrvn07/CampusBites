FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy server files
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
