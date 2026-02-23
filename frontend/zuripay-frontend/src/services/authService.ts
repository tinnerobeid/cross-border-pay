import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { LoginRequest, TokenResponse } from "../types/auth";

export async function login(payload: LoginRequest) {
  const res = await api.post<TokenResponse>(ENDPOINTS.AUTH_LOGIN, payload);
  return res.data;
}
