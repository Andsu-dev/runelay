FROM node:22-slim
COPY --from=oven/bun:1.3.14-slim /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/cli/package.json apps/cli/
COPY apps/web/package.json apps/web/
COPY apps/lp/package.json apps/lp/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/cli apps/cli
COPY apps/web apps/web
RUN bun run build

ENV NODE_ENV=production RUNELEY_DATA=/data HOST=0.0.0.0 PORT=4312 WEB_DIST=/app/apps/web/dist
VOLUME /data
EXPOSE 4312
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4312/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
WORKDIR /app/apps/api
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "src/index.ts"]
