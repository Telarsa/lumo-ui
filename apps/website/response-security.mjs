/** Shared response protections for the static audit and production edge. */
export const HEADERS = Object.freeze({
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), midi=()",
  "Cross-Origin-Opener-Policy": "same-origin",
});

export const TLS_HEADERS = Object.freeze({
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
});

export function secureResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries({ ...HEADERS, ...TLS_HEADERS })) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
