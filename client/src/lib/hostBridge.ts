
declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: any) => void;
      };
    };
  }
}

export const isHosted = (): boolean => {
  return typeof window !== "undefined" && !!window.chrome?.webview?.postMessage;
};

export const postToHost = (message: any): void => {
  if (isHosted()) {
    window.chrome!.webview!.postMessage(message);
  } else {
    console.log("[HostBridge] Mock message to host:", message);
  }
};
