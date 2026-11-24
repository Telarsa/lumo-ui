import { secureResponse } from "./response-security.mjs";
import { languageForRequest } from "./language-routing.mjs";

/** Canonicalise production origins; leave static routing to the ASSETS binding. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestProtocol = url.protocol;
    const productionHost = url.hostname === "lumo-ui.com" || url.hostname === "www.lumo-ui.com";
    if (productionHost && (url.protocol !== "https:" || url.hostname !== "lumo-ui.com")) {
      url.protocol = "https:";
      url.hostname = "lumo-ui.com";
      url.port = "";
      return secureResponse(Response.redirect(url.toString(), 308), requestProtocol);
    }
    if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
      const locale = languageForRequest(request.headers.get("cookie") ?? "", request.headers.get("accept-language") ?? "", request.cf?.country ?? "");
      url.pathname = `/${locale}/`;
      return secureResponse(new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store" } }), requestProtocol);
    }
    return secureResponse(await env.ASSETS.fetch(request), requestProtocol);
  },
};
