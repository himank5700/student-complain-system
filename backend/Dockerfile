# ==========================================================
# Student Complaint Management System - Backend Dockerfile
# Multi-stage/lightweight production Node.js container
# ==========================================================

# 1. Base Image: Official LTS Alpine Linux for minimal size and high security
FROM node:20-alpine

# 2. Install curl for Docker health check
RUN apk add --no-cache curl

# 3. Set Working Directory inside container
WORKDIR /usr/src/app

# 4. Copy package files first for Docker layer caching
COPY backend/package*.json ./

# 5. Install production dependencies only
RUN npm install --omit=dev

# 6. Copy backend source code and frontend assets
COPY backend/src/ ./src/
COPY frontend/ /usr/src/frontend/

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# 7. Expose backend application port
EXPOSE 5000

# 8. Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# 9. Start the Node.js Express server
CMD ["node", "src/app.js"]
