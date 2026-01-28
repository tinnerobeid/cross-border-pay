import { api } from "./api";

export type TransferCreate = {
  send_country: string;
  receive_country: string;
  send_method: string;
  receive_method: string;
  send_amount: number;
  send_currency: string;
  receive_currency: string;
};

export async function createTransfer(payload: TransferCreate) {
  const res = await api.post("/api/v1/transfers", payload);
  return res.data;
}

export async function listTransfers() {
  const res = await api.get("/api/v1/transfers");
  return res.data;
}

export async function getTransfer(id: number) {
  const res = await api.get(`/api/v1/transfers/${id}`);
  return res.data;
}

export async function updateTransferStatus(id: number, status: string) {
  const res = await api.patch(`/api/v1/transfers/${id}/status`, { status });
  return res.data;
}
