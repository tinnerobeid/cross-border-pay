export interface KycStatusResponse {
  status: string; // e.g. "not_submitted" | "pending" | "approved" | "rejected"
  reason?: string;
  raw?: any;
}
