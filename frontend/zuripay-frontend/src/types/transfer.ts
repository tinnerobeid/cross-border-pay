export type TransferStatus = "initiated" | "payment_pending" | "processing" | "sent" | "received" | "failed" | "cancelled";

export interface TransferCreate {
  send_country: string;
  receive_country: string;
  send_currency: string;
  receive_currency: string;
  send_amount: number;
  send_method?: string;
  receive_method?: string;
  recipient_name: string;
  recipient_phone: string;
}

export interface Transfer {
  id: number;
  user_id: number;
  status: TransferStatus;
  send_country: string;
  receive_country: string;
  send_currency: string;
  receive_currency: string;
  send_amount: number;
  receive_amount?: number;
  recipient_name: string;
  recipient_phone: string;
  provider: string;
  fx_rate: number;
  fee_amount: number;
  failure_reason?: string;
  created_at?: string;
  updated_at?: string;
}
