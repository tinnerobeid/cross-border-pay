export interface QuoteRequest {
  send_country: string;
  receive_country: string;
  amount: number;
  currency: string;
}

export interface QuoteResponse {
  provider?: string;
  fee?: number;
  fx_rate?: number;
  payout_amount?: number;
  eta_minutes?: number;
  raw?: any; // fallback if backend returns different shape
}
