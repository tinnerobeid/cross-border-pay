import { api } from "./api";
import type { LoginRequest, RegisterRequest, TokenResponse } from "../types/auth";

export async function login(payload: LoginRequest) {
  // Many FastAPI auth setups use form-data (OAuth2PasswordRequestForm).
  // If your backend expects JSON, this is fine as-is.
  const res = await api.post<TokenResponse>("/auth/login", payload);
  return res.data;
}

export async function register(payload: RegisterRequest) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}
