import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type StaticAssetsBinding = {
  fetch: (request: Request) => Promise<Response> | Response;
};

const APP_BASE_PATH = "/SalesManager";

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

/**
 * Resolve Vite assets through the Cloudflare ASSETS binding before invoking
 * TanStack Start. This is important for a subpath deployment: the HTML may
 * request assets at either /assets/... or /SalesManager/assets/..., while the
 * static asset binding stores them at the origin root.
 */
function toStaticAssetRequest(request: Request): Request | null {
  const url = new URL(request.url);
  let assetPath = url.pathname;

  if (assetPath.startsWith(`${APP_BASE_PATH}/`)) {
    assetPath = assetPath.slice(APP_BASE_PATH.length);
  }

  const isAsset =
    assetPath.startsWith("/assets/") ||
    assetPath.startsWith("/icons/") ||
    assetPath === "/favicon.png" ||
    assetPath === "/manifest.webmanifest" ||
    assetPath === "/robots.txt";

  if (!isAsset) return null;

  url.pathname = assetPath;
  return new Request(url, request);
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
      const assetRequest = toStaticAssetRequest(request);
      const assets = (env as { ASSETS?: StaticAssetsBinding } | null)?.ASSETS;

      // Serve JS/CSS and public files from the actual Cloudflare static asset
      // binding. Do not send these requests into the SSR router as page routes.
      if (assetRequest && assets) {
        const assetResponse = await assets.fetch(assetRequest);
        if (assetResponse.status !== 404) return assetResponse;
      }

      const response = await handler.fetch(request, env, ctx);
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
