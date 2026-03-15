# FlowLens frontend — build then serve with nginx
# Build args: VITE_API_URL, VITE_ANALYTICS_URL (defaults work for local Docker)

FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000
ARG VITE_ANALYTICS_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
