
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
  if (message.type === "UPDATE_ENHANCEMENTS") {
    console.debug(`POST UPDATE_ENHANCEMENTS slot=${message.payload.slot}`, message.payload);
  }

  if (isHosted()) {
    window.chrome!.webview!.postMessage(message);
  } else {
    console.log("[HostBridge] Mock message to host:", message);
  }
};
