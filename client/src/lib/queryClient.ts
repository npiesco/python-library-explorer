import { QueryClient } from "@tanstack/react-query";

interface ExtensionMessageResponse {
  error?: string;
  data?: any;
}

export async function sendExtensionMessage(type: string, data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, data }, (response: ExtensionMessageResponse) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});