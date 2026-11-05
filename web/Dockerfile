FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ENV DATABASE_URL=mysql://build:build@127.0.0.1:3306/build
# next/image is not used, so the traced sharp binaries (~20 MB) are dead weight.
RUN npm run build \
    && rm -rf .next/standalone/node_modules/sharp .next/standalone/node_modules/@img

# Install only the direct dependencies of the two administrative scripts.
FROM node:24-bookworm-slim AS script-deps
WORKDIR /scripts-deps
COPY package-lock.json ./
RUN node -e "const l=require('./package-lock.json');const d={}; for(const n of ['drizzle-orm','mysql2','@node-rs/argon2']) d[n]=l.packages['node_modules/'+n].version; require('fs').writeFileSync('package.json',JSON.stringify({private:true,dependencies:d}))" \
    && npm install --omit=dev --no-package-lock

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app && mkdir -p /app/uploads && chown app:app /app/uploads
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/drizzle ./drizzle
COPY --from=build --chown=app:app /app/scripts/migrate.mjs /app/scripts/create-admin.mjs ./scripts/
COPY --from=script-deps --chown=app:app /scripts-deps/node_modules ./node_modules
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
