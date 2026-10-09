# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# lumo-ui.com: Next's static export served by Caddy.
#
# THE CONTEXT IS THE REPOSITORY ROOT, not this directory. `apps/website`
# depends on `lumo-ui` as `workspace:*`, so a build that could only see this
# folder would have nothing to resolve the package it documents against.
#
#   docker build -f apps/website/Dockerfile -t lumo-ui-website:local .
#   docker run --rm -p 3000:3000 lumo-ui-website:local
#
# THE PRIVATE PERSIAN FONT. IRANSansX is never in git. `COPY . .` carries the
# git-ignored `apps/website/src/assets/fonts/private/` only when it exists in
# the build context (run `LUMO_PRIVATE_FONTS_DIR=... pnpm --filter
# @lumo-ui/website fonts` first). The production image passes
# `--build-arg LUMO_REQUIRE_PRIVATE_FONTS=1`, which fails the build instead of
# silently serving the system Persian fallback. A clean public checkout builds
# with the fallback. The image itself is the private deployment artifact.
#
# Two stages. The first installs the workspace and builds; the second is Caddy
# plus the exported directory and nothing else — no Node, no dependency tree.
# ---------------------------------------------------------------------------
FROM node:24.19.0-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true
# No git hooks in an image: `prepare` runs husky, which has no .git to install into.
ENV HUSKY=0
RUN corepack enable
WORKDIR /app
# The whole workspace, in one layer: this repository is its own dependency, so
# the manifests alone do not make a resolvable tree. The root `.dockerignore`
# keeps the layer small.
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG LUMO_REQUIRE_PRIVATE_FONTS
ENV LUMO_REQUIRE_PRIVATE_FONTS=$LUMO_REQUIRE_PRIVATE_FONTS
# The site's own `build`: font preparation, asset/contract/docs checks,
# `next build`, then own-static-shells.mjs for the root and error documents.
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
