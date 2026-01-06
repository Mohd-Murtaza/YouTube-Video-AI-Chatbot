# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install dependencies and yt-dlp
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    gcc \
    musl-dev \
    python3-dev \
    && python3 -m pip install --upgrade pip \
    && pip install --no-cache-dir yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
