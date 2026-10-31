import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
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
 * Vite emits the app's CSS/JS and public files below /SalesManager, while
 * Nitro's Cloudflare asset binding can expose the same files from the origin
 * root. Resolve those known static paths against the root first, then retain
 * the prefixed request as a fallback for hosts that preserve the subpath.
 *
 * Never rewrite application routes or server-function requests: TanStack
 * Router and the Start server need to see the configured /SalesManager base.
 */
function isSubpathStaticAsset(pathname: string): boolean {
  if (!pathname.startsWith(`${APP_BASE_PATH}/`)) return false;

  const assetPath = pathname.slice(APP_BASE_PATH.length);
  return (
    assetPath.startsWith("/assets/") ||
    assetPath.startsWith("/icons/") ||
    assetPath === "/favicon.png" ||
    assetPath === "/manifest.webmanifest" ||
    assetPath === "/robots.txt"
  );
}

function withoutAppBasePath(request: Request): Request {
  const url = new URL(request.url);
  url.pathname = url.pathname.slice(APP_BASE_PATH.length) || "/";
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
      let response: Response;

      if (isSubpathStaticAsset(new URL(request.url).pathname)) {
        response = await handler.fetch(withoutAppBasePath(request), env, ctx);
        if (response.status === 404) {
          response = await handler.fetch(request, env, ctx);
        }
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
