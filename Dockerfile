# -----------------------------
# Stage 1: Base
# -----------------------------
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# -----------------------------
# Stage 2: Install Dependencies
# -----------------------------
FROM base AS install

# Temp folders for caching dev and prod dependencies
RUN mkdir -p /temp/dev /temp/prod

# Copy package files for dev dependencies
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy package files for prod dependencies
COPY package.json bun.lockb* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# -----------------------------
# Stage 3: Copy Source Code
# -----------------------------
FROM base AS prerelease

# Copy dev node_modules (for optional tests)
COPY --from=install /temp/dev/node_modules node_modules

# Copy full source code (src/, configs, templates, etc.)
COPY . .

# Optional: run tests or build
ENV NODE_ENV=production
# RUN bun test        # Uncomment if you have tests
# RUN bun run build   # Uncomment if you have a build step

# -----------------------------
# Stage 4: Final Production Image
# -----------------------------
FROM base AS release

# Copy production dependencies
COPY --from=install /temp/prod/node_modules node_modules

# Copy only necessary source files (your SMTP server)
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .

# Run as non-root
USER bun

# Expose standard SMTP ports
EXPOSE 25
EXPOSE 587

# Run the SMTP server
ENTRYPOINT ["bun", "run", "src/index.ts"]
