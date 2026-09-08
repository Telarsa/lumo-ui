# Website container deployment

Owner decision, 8 September 2026: prepare Docker on the existing VPS. Existing
Cloudflare publication remains available until a verified domain cutover.
Run every command from the repository root; the monorepo is the build context.

```sh
pnpm check:website
pnpm image:website
pnpm run:website
# Open http://127.0.0.1:3000/en/ (also /de/ and /fa/).
pnpm stop:website
```

`WEBSITE_PORT=4301 pnpm run:website` changes only the local loopback port.
`WEBSITE_IMAGE` chooses a prebuilt image; its default is `lumo-ui-website:local`.
The image contains the static export and Caddy, with no Node runtime, database
or application secrets. Stopping this website deletes no customer data.

For production, publish the checked image and use its immutable `@sha256:`
reference. The infrastructure repository's `runtime/` runner joins only this
website to the shared Caddy network and removes its local port publication.
The edge owns TLS and HSTS. Build off the VPS; deploy with `--no-build`.
Do not pass production secrets into a static website build.

`build:website`, `check:website`, `preview:website` and the existing
`deploy:website` Cloudflare command are retained for the current host. Neither
`image:website` nor `run:website` changes live hosting or DNS. The same image can
run on a customer Docker host; Kubernetes later requires a deployment adapter,
Ingress, secrets and storage/restore planning rather than just a YAML rename.
