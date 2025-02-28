/// <reference types="chrome"/>

interface MessageResponse {
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface ExtensionMessageResponse {
  error?: string;
  data?: any;
}

type MessageData = {
  createVirtualEnv: { name: string; path: string };
  listVirtualEnvs: {};
  setActiveVirtualEnv: { id: number };
  installPackage: { packageName: string; version: string };
  getModuleHelp: { moduleName: string };
  getModuleAttributes: { moduleName: string };
  searchModuleAttributes: { moduleName: string; query: string };
};

const port = chrome.runtime.connectNative('com.python.module.explorer');

// Handle messages from the native host
port.onMessage.addListener((msg: MessageResponse) => {
  console.log('Received message from native host:', msg);
});

// Handle errors
port.onDisconnect.addListener(() => {
  console.error('Disconnected from native host:', chrome.runtime.lastError);
});

// Message handlers for different operations
const handlers = {
  createVirtualEnv: async (data: MessageData['createVirtualEnv']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'CREATE_VENV', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'CREATE_VENV_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  listVirtualEnvs: async () => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'LIST_VIRTUAL_ENVS' });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'LIST_VIRTUAL_ENVS_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  setActiveVirtualEnv: async (data: MessageData['setActiveVirtualEnv']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'SET_ACTIVE_VIRTUAL_ENV', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'SET_ACTIVE_VIRTUAL_ENV_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  installPackage: async (data: MessageData['installPackage']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'INSTALL_PACKAGE', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'INSTALL_PACKAGE_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  getModuleHelp: async (data: MessageData['getModuleHelp']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'GET_MODULE_HELP', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'MODULE_HELP_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  getModuleAttributes: async (data: MessageData['getModuleAttributes']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'GET_MODULE_ATTRIBUTES', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'MODULE_ATTRIBUTES_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  },

  searchModuleAttributes: async (data: MessageData['searchModuleAttributes']) => {
    return new Promise((resolve, reject) => {
      port.postMessage({ type: 'SEARCH_MODULE_ATTRIBUTES', ...data });
      port.onMessage.addListener(function listener(response: MessageResponse) {
        if (response.type === 'SEARCH_MODULE_ATTRIBUTES_RESULT') {
          port.onMessage.removeListener(listener);
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      });
    });
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handler = handlers[request.type as keyof typeof handlers];
  if (handler) {
    handler(request.data)
      .then(sendResponse)
      .catch((error: Error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
  return false;
});