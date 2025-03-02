// /PythonLibraryExplorer/client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import type { DefaultOptions } from "@tanstack/react-query";

interface ExtensionMessageResponse {
  error?: string;
  data?: any;
}

export async function sendExtensionMessage(type: string, data: unknown): Promise<unknown> {
  // Debug flag to help during development
  const DEBUG = process.env.NODE_ENV === 'development';

  // Check if we're in a Chrome extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    // Map message types to correct API endpoints and methods
    type EndpointConfig = {
      endpoint: string | ((data: any) => string);
      method: string;
    };

    const endpointMap: Record<string, EndpointConfig> = {
      listVirtualEnvs: { endpoint: 'venv', method: 'GET' },
      createVirtualEnv: { endpoint: 'venv/create', method: 'POST' },
      setActiveVenv: { endpoint: 'venv/setActive', method: 'POST' },
      setActiveVirtualEnv: { endpoint: 'venv/setActive', method: 'POST' },
      deleteVirtualEnv: { endpoint: (data: any) => `venv/${data.id}`, method: 'DELETE' },
      installPackage: { endpoint: 'packages/install', method: 'POST' },
      getModuleAttributes: { endpoint: 'modules', method: 'GET' },
      getModuleHelp: { endpoint: (data: any) => `modules/help/${encodeURIComponent(data.moduleName)}`, method: 'GET' },
      searchModuleAttributes: { endpoint: 'modules/search', method: 'POST' }
    };

    const { endpoint, method } = endpointMap[type] || { endpoint: type.toLowerCase(), method: 'POST' };
    
    // Handle dynamic endpoints
    const finalEndpoint = typeof endpoint === 'function' ? endpoint(data) : endpoint;
    
    // In web mode, fallback to API calls
    const response = await fetch(`/api/${finalEndpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.json();
  }

  return new Promise((resolve, reject) => {
    if (DEBUG) console.log('Sending message:', { type, data });

    chrome.runtime.sendMessage({ type, data }, (response: ExtensionMessageResponse) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        if (DEBUG) console.error('Chrome runtime error:', error);
        reject(new Error(error));
      } else if (response?.error) {
        if (DEBUG) console.error('Extension response error:', response.error);
        reject(new Error(response.error));
      } else {
        if (DEBUG) console.log('Received response:', response);
        resolve(response?.data);
      }
    });
  });
}

const defaultOptions: DefaultOptions = {
  queries: {
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false
  },
  mutations: {
    retry: false
  }
};

export const queryClient = new QueryClient({
  defaultOptions
});