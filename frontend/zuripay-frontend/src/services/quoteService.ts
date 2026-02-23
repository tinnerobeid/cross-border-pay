import { api } from "./api";
import { ENDPOINTS } from "./endpoints";
import type { QuoteRequest, QuoteResponse } from "../types/quote";

export async function getQuote(payload: QuoteRequest) {
  // many backends use POST for quote calculation
  const res = await api.post<QuoteResponse>(ENDPOINTS.QUOTE, payload);
  return res.data;
}
