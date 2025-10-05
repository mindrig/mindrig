import { useCallback, useMemo } from "react";
import { NavigateOptions, useLocation, useNavigate } from "react-router-dom";
import {
  AppRouteKey,
  AppRoutePath,
  DEFAULT_ROUTE_KEY,
  getRoutePath,
  resolveRouteKey,
} from "./routes";

export interface AppNavigation {
  currentRoute: AppRouteKey;
  currentPath: AppRoutePath;
  navigateTo: (route: AppRouteKey, options?: NavigateOptions) => void;
  replaceWith: (route: AppRouteKey, options?: NavigateOptions) => void;
  goBackOrIndex: () => void;
}

function getHistoryIndex(): number {
  const state = window.history?.state;
  if (!state) return 0;
  if (typeof state.idx === "number") return state.idx;
  if (typeof state.index === "number") return state.index;
  return 0;
}

export function useAppNavigation(): AppNavigation {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoute = resolveRouteKey(location.pathname);
  const currentPath = useMemo(() => getRoutePath(currentRoute), [currentRoute]);

  const navigateTo = useCallback<AppNavigation["navigateTo"]>(
    (route, options) => {
      navigate(getRoutePath(route), options);
    },
    [navigate],
  );

  const replaceWith = useCallback<AppNavigation["replaceWith"]>(
    (route, options) => {
      navigate(getRoutePath(route), { ...options, replace: true });
    },
    [navigate],
  );

  const goBackOrIndex = useCallback(() => {
    const historyIndex = getHistoryIndex();
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(getRoutePath(DEFAULT_ROUTE_KEY), { replace: true });
  }, [navigate]);

  return {
    currentRoute,
    currentPath,
    navigateTo,
    replaceWith,
    goBackOrIndex,
  };
}
