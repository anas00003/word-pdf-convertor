# Use official Node image
FROM node:22

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Create uploads folder (if it doesn't exist)
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
