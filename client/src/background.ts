/// <reference types="chrome"/>

interface MessageResponse {
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface MessageData {
  createVirtualEnv: { name: string; path: string };
  installPackage: { packageName: string; version: string };
  getModuleHelp: { moduleName: string };
}

interface MessageHandlers {
  [K in keyof MessageData]: (data: MessageData[K]) => Promise<any>;
}

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
const handlers: MessageHandlers = {
  createVirtualEnv: async (data) => {
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

  installPackage: async (data) => {
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

  getModuleHelp: async (data) => {
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
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handler = handlers[request.type as keyof MessageHandlers];
  if (handler) {
    handler(request.data)
      .then(sendResponse)
      .catch((error: Error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
  return false;
});