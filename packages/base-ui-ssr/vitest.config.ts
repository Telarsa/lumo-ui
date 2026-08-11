import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/*
 * NO `environment: "jsdom"`.
 *
 * That is the point of this package. Every defect it fixes is a defect of the
 * SERVED BYTES — a name or a description that Base UI publishes from a layout
 * effect, which a jsdom render would run and a server render will not. A suite
 * that mounts these fixtures in jsdom is green whether or not this package
 * exists, and that is exactly how the defect survived upstream review.
 *
 * So the tier here is `renderToStaticMarkup` on the default `node` environment,
 * which cannot run an effect even by accident.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    env: { TZ: "Asia/Tehran" },
  },
});
