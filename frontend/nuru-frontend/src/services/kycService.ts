import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { KycStatusResponse } from "../types/kyc";

export async function uploadKycDocument(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post(ENDPOINTS.KYC_UPLOAD, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getKycStatus() {
  const res = await api.get<KycStatusResponse>(ENDPOINTS.KYC_STATUS);
  return res.data;
}
