import { QueryClient } from "@tanstack/react-query";

interface ExtensionMessageResponse {
  error?: string;
  data?: any;
}

export async function sendExtensionMessage(type: string, data: unknown): Promise<unknown> {
  // Debug flag to help during development
  const DEBUG = process.env.NODE_ENV === 'development';

  // Check if we're in a Chrome extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    const error = 'Chrome extension APIs are not available. Make sure you are running this as a Chrome extension.';
    if (DEBUG) console.error(error);
    throw new Error(error);
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Add better error handling for queries
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      retry: false,
      // Add better error handling for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    },
  },
});