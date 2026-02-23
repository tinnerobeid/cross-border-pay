export type TransferStatus = "initiated" | "processing" | "sent" | "received" | "failed";

export interface TransferCreate {
  send_country: string;
  receive_country: string;
  send_method: string;
  receive_method: string;
  amount: number;
  currency: string;
}

export interface Transfer {
  id: number;
  status: TransferStatus;
  send_country: string;
  receive_country: string;
  send_method: string;
  receive_method: string;
  amount: number;
  currency: string;
  created_at?: string;
}
