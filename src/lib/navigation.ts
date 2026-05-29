/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

type RouteListener = (path: string) => void;
const listeners: Set<RouteListener> = new Set();

export const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  listeners.forEach(cb => cb(path));
};

export const useLocation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    const handleNavigate = (path: string) => {
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    listeners.add(handleNavigate);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      listeners.delete(handleNavigate);
    };
  }, []);

  // Facilitador para rotas paramétricas como /reserva/:id
  const matchRoute = (pattern: string): { matches: boolean; params: Record<string, string> } => {
    // Transformar :id em grupo de captura ([^/]+)
    const regexSource = pattern
      .replace(/\//g, '\\/')
      .replace(/:[a-zA-Z0-9_]+/g, '([^\\/]+)');
    const regex = new RegExp(`^${regexSource}$`);
    const match = currentPath.match(regex);

    if (!match) {
      return { matches: false, params: {} };
    }

    // Extrair os nomes dos parâmetros (Ex: "id" de ":id")
    const paramNames = (pattern.match(/:[a-zA-Z0-9_]+/g) || []).map(name => name.slice(1));
    const params: Record<string, string> = {};
    
    paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    return { matches: true, params };
  };

  return {
    currentPath,
    navigate,
    matchRoute,
  };
};
