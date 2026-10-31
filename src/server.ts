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

function expectedAssetType(path: string): string | undefined {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "css") return "text/css";
  if (extension === "js" || extension === "mjs") return "javascript";
  if (extension === "json" || extension === "webmanifest") return "json";
  if (extension === "png") return "image/";
  if (extension === "jpg" || extension === "jpeg") return "image/";
  if (extension === "svg") return "image/svg+xml";
  if (extension === "woff" || extension === "woff2") return "font/";
  return undefined;
}

function isUsableAssetResponse(response: Response, path: string): boolean {
  if (!response.ok) return false;
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.includes("text/html") || type.includes("text/plain")) return false;
  const expected = expectedAssetType(path);
  if (!expected) return true;
  return type.includes(expected);
}

async function fetchFromCandidates(
  request: Request,
  paths: string[],
  assetsBinding: { fetch: (request: Request) => Promise<Response> } | undefined,
  handler: ServerEntry,
  env: unknown,
  ctx: unknown,
): Promise<Response> {
  const uniquePaths = [...new Set(paths)];
  for (const path of uniquePaths) {
    const url = new URL(request.url);
    url.pathname = path;
    const candidateRequest = new Request(url, request);

    if (assetsBinding && typeof assetsBinding.fetch === "function") {
      const assetResponse = await assetsBinding.fetch(candidateRequest);
      if (isUsableAssetResponse(assetResponse, path)) return assetResponse;
    }

    const serverResponse = await handler.fetch(candidateRequest, env, ctx);
    if (isUsableAssetResponse(serverResponse, path)) return serverResponse;
  }

  return new Response("Static asset not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const incomingUrl = new URL(request.url);
      const path = incomingUrl.pathname;
      const prefix = "/SalesManager";
      const isPrefixedBuildAssets = path.startsWith(`${prefix}/_build/assets/`);
      const isPrefixedLegacyAssets = path.startsWith(`${prefix}/assets/`);
      const isPrefixedAssets = isPrefixedBuildAssets || isPrefixedLegacyAssets;
      const isPrefixedPublicFile =
        path.startsWith(`${prefix}/icons/`) ||
        path === `${prefix}/favicon.png` ||
        path === `${prefix}/manifest.webmanifest`;

      const bindings = (env ?? {}) as Record<string, unknown>;
      const assetsBinding = bindings["ASSETS"] as
        | { fetch: (request: Request) => Promise<Response> }
        | undefined;

      let response: Response;
      if (isPrefixedAssets) {
        const suffix = isPrefixedBuildAssets
          ? path.slice(`${prefix}/_build/assets`.length)
          : path.slice(`${prefix}/assets`.length);
        // Nitro/Cloudflare builds can publish the same Vite asset with or without
        // the app mount prefix. Try the exact browser URL first, then each
        // generated public-directory layout before falling back to the SSR handler.
        const candidates = [
          path,
          `${prefix}/assets${suffix}`,
          `${prefix}/_build/assets${suffix}`,
          `/assets${suffix}`,
          `/_build/assets${suffix}`,
        ];
        response = await fetchFromCandidates(
          request,
          candidates,
          assetsBinding,
          handler,
          env,
          ctx,
        );
      } else if (isPrefixedPublicFile) {
        const unprefixedPath = path.slice(prefix.length) || "/";
        response = await fetchFromCandidates(
          request,
          [path, unprefixedPath],
          assetsBinding,
          handler,
          env,
          ctx,
        );
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
