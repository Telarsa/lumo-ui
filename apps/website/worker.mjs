import { secureResponse } from "./response-security.mjs";

/** Canonicalise production origins; leave static routing to the ASSETS binding. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const productionHost = url.hostname === "lumo-ui.com" || url.hostname === "www.lumo-ui.com";
    if (productionHost && (url.protocol !== "https:" || url.hostname !== "lumo-ui.com")) {
      url.protocol = "https:";
      url.hostname = "lumo-ui.com";
      url.port = "";
      return secureResponse(Response.redirect(url.toString(), 308));
    }
    return secureResponse(await env.ASSETS.fetch(request));
  },
};
