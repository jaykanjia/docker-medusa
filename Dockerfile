# Use a specific version for better reproducibility
FROM node:20-alpine AS base

# Add non-root user for security
RUN addgroup -S medusa-group && adduser -S medusa-user -G medusa-group

FROM base AS builder
WORKDIR /app

# Copy only package files first to leverage cache
COPY package.json yarn.lock ./

# Clean install with security flags
RUN yarn install --inline-builds \
    --frozen-lockfile \
    --no-cache \
    --production \
    && yarn cache clean

# Copy source code
COPY . .

# Build production assets
RUN yarn build && yarn cache clean

# Use a non-root user for running the application
FROM base AS runner
WORKDIR /app

COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations.sh ./migrations.sh

EXPOSE 9000

# Install server dependencies
WORKDIR /app/.medusa/server
RUN yarn install --production

# RUN medusa migrations run 
COPY migrations.sh /app/.medusa/server/migrations.sh
RUN chmod +x /app/.medusa/server/migrations.sh
RUN /app/.medusa/server/migrations.sh

RUN rm /app/.medusa/server/migrations.sh

# Set proper ownership
RUN chown -R medusa-user:medusa-group /app

# Use non-root user
USER medusa-user

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Predeploy and start
CMD ["sh", "-c", "yarn start"]