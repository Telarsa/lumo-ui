# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# lumo-ui.com: Next's static export served by Caddy.
#
# THE CONTEXT IS THE REPOSITORY ROOT, not this directory. `apps/website`
# depends on `lumo-ui` as `file:../..`, so a build that could only see this
# folder would have nothing to resolve the package it documents against.
#
#   docker build -f apps/website/Dockerfile -t lumo-ui-site .
#   docker run --rm -p 3000:3000 lumo-ui-site
#
# Two stages. The first installs the workspace and builds; the second is Caddy
# plus the exported directory and nothing else — no Node, no dependency tree.
# The release workflow (shared, in Telarsa/infrastructure) builds this, labels
# it, pushes it by digest and opens the deploy pull request.
# ---------------------------------------------------------------------------
# Renovate keeps both base images current and adds their digests.
FROM node:24.19.0-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true
# No git hooks in an image: `prepare` runs husky, which has no .git to install into.
ENV HUSKY=0
RUN corepack enable
WORKDIR /app
# The whole workspace, in one layer. Splitting the manifests out would buy a
# cached install, but this repository is its own dependency — every package
# under `packages/` is resolved by path — so the manifests alone do not make a
# resolvable tree, and a partial copy fails in a way that reads as a lockfile
# problem. The `.dockerignore` beside this file is what keeps the layer small.
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
# The website's own `build` runs `next build` and then own-the-404.mjs, which
# replaces the export's three English not-found shells with the site's own.
RUN pnpm --filter @lumo-ui/website build

FROM caddy:2.10-alpine AS runtime
COPY apps/website/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/website/out /srv
# Non-root, on an unprivileged port. Caddy keeps its state under /data and
# /config, so those belong to the user it runs as.
RUN setcap -r /usr/bin/caddy \
  && addgroup -S -g 1001 site \
  && adduser -S -u 1001 -G site -H -s /sbin/nologin site \
  && mkdir -p /data /config \
  && chown -R site:site /data /config
USER site
EXPOSE 3000
# A static site is healthy when it serves its own home page.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/en/ > /dev/null || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
