import Constants from 'expo-constants';

// base URL can be configured via expo constants extra, fallback to localhost
export const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  // on Android emulator localhost refers to emulator itself; use 10.0.2.2
  (Constants.platform?.android
    ? 'http://10.0.2.2:8000'
    : 'http://localhost:8000');

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserOut {
  id: number;
  email: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
  if (!res.ok) {
    const message = data?.detail || data?.message || res.statusText;
    throw new Error(`API ${res.status}: ${message}`);
  }
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<UserOut> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
