import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { KycStatusResponse } from "../types/kyc";

export async function getKycStatus() {
  const res = await api.get<KycStatusResponse>(ENDPOINTS.KYC_GET);
  return res.data;
}

export async function submitKyc(
  country: string,
  idType: string,
  idNumber: string,
  selfie: File,
  idFront: File,
  idBack?: File
) {
  const form = new FormData();
  form.append("country", country);
  form.append("id_type", idType);
  form.append("id_number", idNumber);
  form.append("selfie", selfie);
  form.append("id_front", idFront);
  if (idBack) form.append("id_back", idBack);

  const res = await api.post(ENDPOINTS.KYC_SUBMIT, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
