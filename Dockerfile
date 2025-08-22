FROM node:20-alpine

WORKDIR /app

# Install dependencies using pnpm
COPY pnpm-lock.yaml package.json ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

EXPOSE 3000

# Build and start the application with pnpm
RUN pnpm run build

CMD ["pnpm", "start"]
