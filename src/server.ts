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

      // This app is mounted below /SalesManager on the existing rssapps.net
      // site. Nitro may publish generated client assets under /_build/assets,
      // while Vite's base prefix can make the HTML request /SalesManager/assets.
      // Try both known Nitro/Vite asset locations without changing page routes.
      const incomingUrl = new URL(request.url);
      const path = incomingUrl.pathname;
      const isPrefixedAssets = path.startsWith("/SalesManager/assets/");
      const isPrefixedPublicFile =
        path.startsWith("/SalesManager/icons/") ||
        path === "/SalesManager/favicon.png" ||
        path === "/SalesManager/manifest.webmanifest";

      let response: Response;
      if (isPrefixedAssets) {
        const assetSuffix = path.slice("/SalesManager/assets".length);
        const candidates = ["/_build/assets" + assetSuffix, "/assets" + assetSuffix];
        response = new Response(null, { status: 404 });
        for (const candidate of candidates) {
          const candidateUrl = new URL(request.url);
          candidateUrl.pathname = candidate;
          const candidateRequest = new Request(candidateUrl, request);
          const candidateResponse = await handler.fetch(candidateRequest, env, ctx);
          if (candidateResponse.status !== 404) {
            response = candidateResponse;
            break;
          }
          response = candidateResponse;
        }
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
