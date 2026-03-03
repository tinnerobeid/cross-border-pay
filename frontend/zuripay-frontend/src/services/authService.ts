import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "../types/auth";

export async function login(payload: LoginRequest) {
  const res = await api.post<TokenResponse>(ENDPOINTS.AUTH_LOGIN, payload);
  return res.data;
}

export async function register(payload: RegisterRequest) {
  const res = await api.post<UserResponse>(ENDPOINTS.AUTH_REGISTER, payload);
  return res.data;
}
