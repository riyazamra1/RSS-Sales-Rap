import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();

      // The Cloudflare Worker route only covers /SalesManager*. Static assets
      // normally live at /assets or /_build/assets, so rewriting the URL and
      // calling the Start handler is not enough: ask the Workers Static Assets
      // binding directly for the original built file.
      const incomingUrl = new URL(request.url);
      const path = incomingUrl.pathname;
      const isPrefixedAssets = path.startsWith("/SalesManager/assets/");
      const isPrefixedPublicFile =
        path.startsWith("/SalesManager/icons/") ||
        path === "/SalesManager/favicon.png" ||
        path === "/SalesManager/manifest.webmanifest";

      const bindings = (env ?? {}) as Record<string, unknown>;
      const assetsBinding = bindings["ASSETS"] as
        | { fetch: (request: Request) => Promise<Response> }
        | undefined;

      let response: Response;
      if (isPrefixedAssets && assetsBinding && typeof assetsBinding.fetch === "function") {
        const assetSuffix = path.slice("/SalesManager/assets".length);
        const candidates = ["/_build/assets" + assetSuffix, "/assets" + assetSuffix];
        response = new Response("Static asset not found", { status: 404 });
        for (const candidate of candidates) {
          const candidateUrl = new URL(request.url);
          candidateUrl.pathname = candidate;
          const candidateResponse = await assetsBinding.fetch(new Request(candidateUrl, request));
          // SSR catch-all handlers can return index.html with status 200 for a
          // missing asset. Never treat an HTML fallback as a successful CSS/JS file.
          const contentType = candidateResponse.headers.get("content-type") ?? "";
          const looksLikeHtml = contentType.includes("text/html");
          if (candidateResponse.ok && !looksLikeHtml) {
            response = candidateResponse;
            break;
          }
          response = new Response("Static asset not found", { status: 404 });
        }
      } else if (isPrefixedAssets) {
        // Fallback for deployments where Nitro serves its own public files.
        const assetSuffix = path.slice("/SalesManager/assets".length);
        const candidates = ["/_build/assets" + assetSuffix, "/assets" + assetSuffix];
        response = new Response("Static asset not found", { status: 404 });
        for (const candidate of candidates) {
          const candidateUrl = new URL(request.url);
          candidateUrl.pathname = candidate;
          const candidateResponse = await handler.fetch(new Request(candidateUrl, request), env, ctx);
          // SSR catch-all handlers can return index.html with status 200 for a
          // missing asset. Never treat an HTML fallback as a successful CSS/JS file.
          const contentType = candidateResponse.headers.get("content-type") ?? "";
          const looksLikeHtml = contentType.includes("text/html");
          if (candidateResponse.ok && !looksLikeHtml) {
            response = candidateResponse;
            break;
          }
          response = new Response("Static asset not found", { status: 404 });
        }
      } else if (isPrefixedPublicFile && assetsBinding && typeof assetsBinding.fetch === "function") {
        const candidateUrl = new URL(request.url);
        candidateUrl.pathname = path.slice("/SalesManager".length) || "/";
        response = await assetsBinding.fetch(new Request(candidateUrl, request));
      } else if (isPrefixedPublicFile) {
        const candidateUrl = new URL(request.url);
        candidateUrl.pathname = path.slice("/SalesManager".length) || "/";
        response = await handler.fetch(new Request(candidateUrl, request), env, ctx);
      } else {
        response = await handler.fetch(request, env, ctx);
      }
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
