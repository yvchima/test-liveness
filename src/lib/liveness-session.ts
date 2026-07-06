export const API_BASE_URL = import.meta.env.VITE_APP_IDENTITY_SERVICE_API_BASE_URL as string | undefined;
export const API_TOKEN = import.meta.env.VITE_APP_API_TOKEN as string | undefined;
export const PUBLIC_MERCHANT_ID = import.meta.env.VITE_APP_SDK_PUBLIC_KEY as string | undefined;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: API_TOKEN ?? "",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  const json = await response.json();
  return json.data as T;
}

export async function generateSessionId(): Promise<string> {
  const data = await postJson<{ sessionId: string }>(
    "/v2/api/identity/sdk/session/generate",
    { publicMerchantID: PUBLIC_MERCHANT_ID, metadata: {} },
  );
  return data.sessionId;
}

export async function generateSessionToken(deviceCorrelationId: string): Promise<string> {
  const data = await postJson<{ authToken: string }>(
    "/v2/api/identity/sdk/liveness/token",
    { publicMerchantID: PUBLIC_MERCHANT_ID, deviceCorrelationId },
  );
  return data.authToken;
}

export function generateDeviceCorrelationId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
