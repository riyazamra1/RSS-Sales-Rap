import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // Let TanStack Router own the application subpath. The previous input/output
    // rewrite manually added the prefix to URLs that already contained it,
    // producing /SalesManager/SalesManager/.
    basepath: "/SalesManager",
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
