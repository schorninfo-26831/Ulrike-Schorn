# Weg B: ein Container, ein Prozess. Keine Zugangsdaten hier — die kommen aus der Umgebung des Hosters.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
# Uploads (und SQLite, solange keine DATABASE_URL gesetzt ist) liegen unter /app/data — als Volume einhängen.
RUN mkdir -p data/uploads && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:3000/health || exit 1
# Das Seed ist idempotent: beim ersten Start spielt es die Startseiten ein, danach lässt es alles in Ruhe (P5).
CMD ["sh", "-c", "node scripts/seed.mjs && node server.js"]
