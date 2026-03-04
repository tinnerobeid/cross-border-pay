export interface QuoteRequest {
  send_country: string;
  receive_country: string;
  send_amount: number;
  send_currency: string;
  receive_currency: string;
}

export interface QuoteResponse {
  id: number;
  send_amount: number;
  fx_rate: number;
  fee_amount: number;
  receive_amount: number;
  total_cost: number;
  status: string;
  expires_at: string;
  raw?: any;
}
