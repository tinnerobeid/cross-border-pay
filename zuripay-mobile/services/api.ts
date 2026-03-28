import Constants from 'expo-constants';

export const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Constants.platform?.android ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export interface RegisterPayload { full_name: string; email: string; password: string; phone: string; country_of_residence?: string }
export interface LoginPayload { email: string; password: string }
export interface UserOut { id: number; email: string; full_name: string; phone: string | null; role: string; is_active: boolean; is_verified: boolean }
export interface SendOTPRequest { email: string }
export interface VerifyOTPRequest { email: string; otp_code: string }
export interface OTPResponse { message: string; access_token?: string }
export interface TokenResponse { access_token: string }

export interface TransferCreate {
  send_country: string; receive_country: string; send_currency: string; receive_currency: string;
  send_amount: number; recipient_name: string; recipient_phone: string;
  is_linked_recipient?: boolean;
}
export interface TransferOut {
  id: number; user_id: number; send_country: string; receive_country: string;
  send_currency: string; receive_currency: string; send_amount: number;
  rate_used: number | null; fee_used: number | null; zuripay_fee: number | null;
  transfer_type: string | null; total_payable: number | null;
  receive_amount: number | null; recipient_name: string; recipient_phone: string;
  provider: string; status: string; fail_reason: string | null; created_at: string;
}

export interface QuoteRequest { send_country: string; receive_country: string; send_currency: string; receive_currency: string; send_amount: number; is_linked_recipient?: boolean }
export interface QuoteResponse { id: number; send_amount: number; fx_rate: number; fee_amount: number; transfer_fee: number; exchange_fee: number; receive_amount: number; total_cost: number; zuripay_fee: number; transfer_type: string; expires_at: string; status: string }

export interface KYCOut { id: number; user_id: number; status: string; country: string; id_type: string; id_number: string; review_note: string | null }

export interface RecipientCreate { name: string; phone: string; bank_name?: string; account_number?: string; country: string; currency: string }
export interface RecipientOut { id: number; user_id: number; name: string; phone: string; bank_name: string | null; account_number: string | null; country: string; currency: string }

const TIMEOUT_MS = 10000;

async function apiFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Request timed out. Is the server running?');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
  if (!res.ok) throw new Error(data?.detail || data?.message || res.statusText);
  return data;
}

async function authFetch(url: string, options: RequestInit, token: string): Promise<Response> {
  return apiFetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
}

export async function registerUser(p: RegisterPayload): Promise<UserOut> {
  return handleResponse(await apiFetch(BASE_URL + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }));
}
export async function loginUser(p: LoginPayload): Promise<TokenResponse> {
  return handleResponse(await apiFetch(BASE_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }));
}
export async function sendOTP(p: SendOTPRequest): Promise<OTPResponse> {
  return handleResponse(await apiFetch(BASE_URL + '/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }));
}
export async function verifyOTP(p: VerifyOTPRequest): Promise<OTPResponse> {
  return handleResponse(await apiFetch(BASE_URL + '/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }));
}
export async function getCurrentUser(token: string): Promise<UserOut> {
  return handleResponse(await authFetch(BASE_URL + '/auth/me', { method: 'GET' }, token));
}

export async function createQuote(p: QuoteRequest, token: string): Promise<QuoteResponse> {
  return handleResponse(await authFetch(BASE_URL + '/quote', { method: 'POST', body: JSON.stringify(p) }, token));
}

export async function lookupRecipient(phone: string, token: string): Promise<{ is_linked: boolean; name: string | null }> {
  return handleResponse(await authFetch(BASE_URL + `/transfers/lookup?phone=${encodeURIComponent(phone)}`, { method: 'GET' }, token));
}

export async function createTransfer(p: TransferCreate, token: string): Promise<TransferOut> {
  return handleResponse(await authFetch(BASE_URL + '/transfers', { method: 'POST', body: JSON.stringify(p) }, token));
}
export async function getTransfers(token: string, skip = 0, limit = 50): Promise<TransferOut[]> {
  return handleResponse(await authFetch(BASE_URL + `/transfers?skip=${skip}&limit=${limit}`, { method: 'GET' }, token));
}
export async function getTransfer(id: number, token: string): Promise<TransferOut> {
  return handleResponse(await authFetch(BASE_URL + '/transfers/' + id, { method: 'GET' }, token));
}

export async function getKYC(token: string): Promise<KYCOut | null> {
  const res = await authFetch(BASE_URL + '/kyc/', { method: 'GET' }, token);
  if (res.status === 404) return null;
  const data = await handleResponse(res);
  return data ?? null;
}
export async function submitKYC(
  token: string,
  fields: { country: string; id_type: string; id_number: string },
  selfieUri: string,
  idFrontUri: string,
  idBackUri?: string,
): Promise<KYCOut> {
  const form = new FormData();
  form.append('country', fields.country);
  form.append('id_type', fields.id_type);
  form.append('id_number', fields.id_number);
  form.append('selfie', { uri: selfieUri, type: 'image/jpeg', name: 'selfie.jpg' } as any);
  form.append('id_front', { uri: idFrontUri, type: 'image/jpeg', name: 'id_front.jpg' } as any);
  if (idBackUri) form.append('id_back', { uri: idBackUri, type: 'image/jpeg', name: 'id_back.jpg' } as any);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(BASE_URL + '/kyc/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
    return handleResponse(res);
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Upload timed out.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function getRecipients(token: string): Promise<RecipientOut[]> {
  return handleResponse(await authFetch(BASE_URL + '/recipients', { method: 'GET' }, token));
}
export async function createRecipient(p: RecipientCreate, token: string): Promise<RecipientOut> {
  return handleResponse(await authFetch(BASE_URL + '/recipients', { method: 'POST', body: JSON.stringify(p) }, token));
}
export async function deleteRecipient(id: number, token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/recipients/' + id, { method: 'DELETE' }, token));
}

export interface LinkedAccountOut {
  id: number; account_type: string; provider: string;
  account_holder: string; account_number: string;
  currency: string; country: string; is_default: boolean;
}
export interface LinkAccountRequest {
  account_type: string; provider: string; account_holder: string;
  account_number: string; currency: string; country: string;
}

export async function getLinkedAccounts(token: string): Promise<LinkedAccountOut[]> {
  return handleResponse(await authFetch(BASE_URL + '/linked-accounts', { method: 'GET' }, token));
}
export async function linkAccount(p: LinkAccountRequest, token: string): Promise<LinkedAccountOut> {
  return handleResponse(await authFetch(BASE_URL + '/linked-accounts', { method: 'POST', body: JSON.stringify(p) }, token));
}
export async function setDefaultLinkedAccount(id: number, token: string): Promise<LinkedAccountOut> {
  return handleResponse(await authFetch(BASE_URL + '/linked-accounts/' + id + '/default', { method: 'PATCH' }, token));
}
export async function unlinkAccount(id: number, token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/linked-accounts/' + id, { method: 'DELETE' }, token));
}

export interface WalletOut { id: number; currency: string; balance: number; is_primary: boolean }

export async function getWallets(token: string): Promise<WalletOut[]> {
  return handleResponse(await authFetch(BASE_URL + '/wallets', { method: 'GET' }, token));
}
export async function addWallet(currency: string, token: string): Promise<WalletOut> {
  return handleResponse(await authFetch(BASE_URL + '/wallets', { method: 'POST', body: JSON.stringify({ currency }) }, token));
}
export async function removeWallet(id: number, token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/wallets/' + id, { method: 'DELETE' }, token));
}
export async function setPrimaryWallet(id: number, token: string): Promise<WalletOut> {
  return handleResponse(await authFetch(BASE_URL + '/wallets/' + id + '/primary', { method: 'PATCH' }, token));
}
export interface DepositOut { wallet_id: number; currency: string; amount: number; new_balance: number; source: string }
export async function depositFromLinkedAccount(walletId: number, linkedAccountId: number, amount: number, token: string): Promise<DepositOut> {
  return handleResponse(await authFetch(BASE_URL + '/wallets/' + walletId + '/deposit', {
    method: 'POST', body: JSON.stringify({ linked_account_id: linkedAccountId, amount }),
  }, token));
}

export interface RatePreview { from_currency: string; to_currency: string; rate: number }

export async function getLiveRates(token: string): Promise<RatePreview[]> {
  return handleResponse(await authFetch(BASE_URL + '/quote/rates/live', { method: 'GET' }, token));
}

export async function deleteAccount(token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/auth/me', { method: 'DELETE' }, token));
}

export async function changePassword(current_password: string, new_password: string, token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/auth/password', { method: 'PATCH', body: JSON.stringify({ current_password, new_password }) }, token));
}

export async function getPinStatus(token: string): Promise<{ has_pin: boolean }> {
  return handleResponse(await authFetch(BASE_URL + '/auth/pin/status', { method: 'GET' }, token));
}

export async function changePin(payload: { current_pin?: string; new_pin: string; confirm_pin: string }, token: string): Promise<void> {
  return handleResponse(await authFetch(BASE_URL + '/auth/pin', { method: 'PATCH', body: JSON.stringify(payload) }, token));
}

export interface SwapOut { from_currency: string; to_currency: string; from_amount: number; to_amount: number; rate: number; from_new_balance: number; to_new_balance: number }

export async function swapWallets(from_wallet_id: number, to_wallet_id: number, amount: number, token: string): Promise<SwapOut> {
  return handleResponse(await authFetch(BASE_URL + '/wallets/swap', { method: 'POST', body: JSON.stringify({ from_wallet_id, to_wallet_id, amount }) }, token));
}

export async function requestPhoneChange(new_phone: string, token: string): Promise<{ message: string }> {
  return handleResponse(await authFetch(BASE_URL + '/auth/phone/request', { method: 'POST', body: JSON.stringify({ new_phone }) }, token));
}

export async function verifyPhoneChange(otp_code: string, token: string): Promise<{ message: string; phone: string }> {
  return handleResponse(await authFetch(BASE_URL + '/auth/phone/verify', { method: 'POST', body: JSON.stringify({ otp_code }) }, token));
}
