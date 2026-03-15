# FlowLens Express API — production-style image
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Application code
COPY src ./src

# Listen on all interfaces (for Docker and cloud)
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/index.js"]
