// ─── Type declarations for web-push (JS-only library) ────────────────────────

declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  interface RequestDetails {
    endpoint: string;
    method: "POST";
    headers: Record<string, string>;
    body: Buffer | null;
  }

  interface SendNotificationOptions {
    gcmAPIKey?: string;
    vapidDetails?: VapidDetails;
    timeout?: number;
    TTL?: number;
    headers?: Record<string, string>;
    contentEncoding?: "aesgcm" | "aes128gcm";
    urgency?: "very-low" | "low" | "normal" | "high";
    topic?: string;
    proxy?: string;
    agent?: unknown;
  }

  class WebPushError extends Error {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    constructor(message: string, statusCode: number, headers: Record<string, string>, body: string);
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function setGCMAPIKey(apiKey: string): void;
  function generateVAPIDKeys(): VapidKeys;
  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer | null,
    options?: SendNotificationOptions
  ): Promise<RequestDetails>;
  function generateRequestDetails(
    subscription: PushSubscription,
    payload: string | Buffer | null,
    options?: SendNotificationOptions
  ): RequestDetails;
  function encrypt(
    userPublicKey: string,
    userAuth: string,
    payload: string | Buffer,
    contentEncoding: "aesgcm" | "aes128gcm"
  ): Promise<{ localPublicKey: string; salt: string; cipherText: Buffer }>;

  export {
    PushSubscription,
    VapidKeys,
    VapidDetails,
    RequestDetails,
    SendNotificationOptions,
    WebPushError,
    setVapidDetails,
    setGCMAPIKey,
    generateVAPIDKeys,
    sendNotification,
    generateRequestDetails,
    encrypt,
  };

  const webpush: {
    WebPushError: typeof WebPushError;
    supportedContentEncodings: { aesgcm: string; aes128gcm: string };
    encrypt: typeof encrypt;
    getVapidHeaders: (audience: string, subject: string, publicKey: string, privateKey: string, contentEncoding: string, expiration?: number) => { Authorization: string; "Crypto-Key": string };
    generateVAPIDKeys: typeof generateVAPIDKeys;
    setGCMAPIKey: typeof setGCMAPIKey;
    setVapidDetails: typeof setVapidDetails;
    generateRequestDetails: typeof generateRequestDetails;
    sendNotification: typeof sendNotification;
  };

  export default webpush;
}
