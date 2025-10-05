export const APP_ROUTE_CONFIG = {
  index: {
    path: "/" as const,
    aliases: ["/index.html" as const],
  },
  auth: {
    path: "/auth" as const,
    aliases: [] as const,
  },
} as const;

export type AppRouteKey = keyof typeof APP_ROUTE_CONFIG;
export type AppRoutePath = (typeof APP_ROUTE_CONFIG)[AppRouteKey]["path"];
export type AppRouteAlias =
  (typeof APP_ROUTE_CONFIG)[AppRouteKey]["aliases"][number];
export type AppRoutePathLike = AppRoutePath | AppRouteAlias;

export const DEFAULT_ROUTE_KEY: AppRouteKey = "index";

export const ALL_ROUTE_PATHS: AppRoutePathLike[] = Object.values(
  APP_ROUTE_CONFIG,
).flatMap((config) => [config.path, ...config.aliases]);

export function getRoutePath(key: AppRouteKey): AppRoutePath {
  return APP_ROUTE_CONFIG[key].path;
}

export function normaliseRoutePath(
  path: string | null | undefined,
): AppRoutePathLike {
  if (!path) return APP_ROUTE_CONFIG[DEFAULT_ROUTE_KEY].path;
  if (!path.startsWith("/")) {
    const withLeadingSlash = `/${path}` as AppRoutePathLike;
    return withLeadingSlash;
  }
  return path as AppRoutePathLike;
}

export function resolveRouteKey(path: string | null | undefined): AppRouteKey {
  const normalised = normaliseRoutePath(path);
  for (const [key, config] of Object.entries(APP_ROUTE_CONFIG) as Array<
    [AppRouteKey, (typeof APP_ROUTE_CONFIG)[AppRouteKey]]
  >) {
    if (config.path === normalised) return key;
    if (config.aliases.some((alias) => alias === normalised)) return key;
  }
  return DEFAULT_ROUTE_KEY;
}

export function isIndexRouteKey(key: AppRouteKey): boolean {
  return key === "index";
}

export function isIndexRoutePath(path: string | null | undefined): boolean {
  return isIndexRouteKey(resolveRouteKey(path));
}
