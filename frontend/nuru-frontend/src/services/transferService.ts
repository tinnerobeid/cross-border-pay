import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { Transfer, TransferCreate } from "../types/transfer";

export async function createTransfer(payload: TransferCreate) {
  const res = await api.post<Transfer>(ENDPOINTS.TRANSFERS, payload);
  return res.data;
}

export async function listTransfers() {
  const res = await api.get<Transfer[]>(ENDPOINTS.TRANSFERS);
  return res.data;
}
