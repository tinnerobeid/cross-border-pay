import { api } from "./api";
import type { Transfer, TransferCreate } from "../types/transfer";

export async function createTransfer(payload: TransferCreate) {
  const res = await api.post<Transfer>("/transfers", payload);
  return res.data;
}

export async function listTransfers() {
  const res = await api.get<Transfer[]>("/transfers");
  return res.data;
}
