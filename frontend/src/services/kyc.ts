import { api } from "./api";

export type KycPayload = {
  full_name?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
};

export async function getKyc(userId: number) {
  const res = await api.get(`/api/v1/kyc/${userId}`);
  return res.data;
}

export async function upsertKyc(userId: number, payload: KycPayload) {
  const res = await api.put(`/api/v1/kyc/${userId}`, payload);
  return res.data;
}

export async function submitKyc(userId: number) {
  const res = await api.post(`/api/v1/kyc/${userId}/submit`);
  return res.data;
}
