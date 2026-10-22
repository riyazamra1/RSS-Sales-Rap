import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    rewrite: {
      input: ({ url }) => {
        if (url.pathname === "/SalesManager") {
          url.pathname = "/";
        } else if (url.pathname.startsWith("/SalesManager/")) {
          url.pathname = url.pathname.slice("/SalesManager".length) || "/";
        }
        return url;
      },
      output: ({ url }) => {
        if (url.pathname === "/") {
          url.pathname = "/SalesManager/";
        } else if (!url.pathname.startsWith("/SalesManager/") && url.pathname !== "/SalesManager") {
          url.pathname = "/SalesManager" + url.pathname;
        }
        return url;
      },
    },
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
