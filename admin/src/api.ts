const BASE_URL = 'http://localhost:8000'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  active_users: number
  verified_users: number
  pending_kyc: number
  approved_kyc: number
  total_transfers: number
  transfers_today: number
  volume_today: number
  volume_total: number
  failed_transfers: number
  cancelled_transfers: number
  total_fees_earned: number
  fees_earned_today: number
}

export interface User {
  id: number
  email: string
  full_name: string
  phone: string
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface KYCRecord {
  id: number
  user_id: number
  status: string
  country: string
  id_type: string
  id_number: string
  selfie_path: string
  id_front_path: string
  id_back_path: string
  review_note: string | null
  submitted_at: string
  reviewed_at: string | null
  user_email: string
  user_name: string
}

export interface Transfer {
  id: number
  user_id: number
  send_country: string
  receive_country: string
  send_currency: string
  receive_currency: string
  send_amount: number
  send_amount_krw: number | null
  rate_used: number
  fee_used: number
  total_payable: number
  receive_amount: number
  recipient_name: string
  recipient_phone: string
  provider: string
  status: string
  fail_reason: string | null
  created_at: string
}

export interface Rate {
  pair: string
  rate: number
  is_override: boolean
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('zuripay_admin_token')
}

async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('zuripay_admin_token')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body.detail ?? body.message ?? message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  return request('/auth/admin/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function checkSetupStatus(): Promise<{ admin_exists: boolean }> {
  return request('/auth/setup/status', null)
}

export async function setupFirstAdmin(data: {
  email: string; full_name: string; password: string; phone?: string
}): Promise<{ access_token: string }> {
  return request('/auth/setup', null, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createUser(token: string, data: {
  email: string; full_name: string; phone?: string; password: string; role: string
}): Promise<User> {
  return request('/admin/users', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats(token: string): Promise<AdminStats> {
  return request('/admin/stats', token)
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UsersFilter {
  search?: string
  is_active?: boolean | ''
  is_verified?: boolean | ''
  role?: string
  skip?: number
  limit?: number
}

export async function getUsers(token: string, filters: UsersFilter = {}): Promise<User[]> {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.is_active !== '' && filters.is_active !== undefined)
    params.set('is_active', String(filters.is_active))
  if (filters.is_verified !== '' && filters.is_verified !== undefined)
    params.set('is_verified', String(filters.is_verified))
  if (filters.role) params.set('role', filters.role)
  if (filters.skip !== undefined) params.set('skip', String(filters.skip))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return request(`/admin/users${qs ? `?${qs}` : ''}`, token)
}

export async function getUserById(token: string, id: number): Promise<User> {
  return request(`/admin/users/${id}`, token)
}

export async function getUserTransfers(token: string, id: number): Promise<Transfer[]> {
  return request(`/admin/users/${id}/transfers`, token)
}

export async function updateUserStatus(token: string, id: number, is_active: boolean): Promise<User> {
  return request(`/admin/users/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  })
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export async function getKYCRecords(token: string, status?: string): Promise<KYCRecord[]> {
  const qs = status ? `?status=${status}` : ''
  return request(`/admin/kyc${qs}`, token)
}

export async function approveKYC(token: string, id: number, note: string): Promise<KYCRecord> {
  return request(`/admin/kyc/${id}/approve`, token, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}

export async function rejectKYC(token: string, id: number, note: string): Promise<KYCRecord> {
  return request(`/admin/kyc/${id}/reject`, token, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export interface PeriodStats {
  from_date: string | null
  to_date: string | null
  transfer_count: number
  completed_count: number
  total_volume: number
  total_fees: number
}

export interface TransfersFilter {
  status?: string
  user_id?: number
  from_date?: string
  to_date?: string
  skip?: number
  limit?: number
}

export async function getTransfers(token: string, filters: TransfersFilter = {}): Promise<Transfer[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.user_id !== undefined) params.set('user_id', String(filters.user_id))
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date) params.set('to_date', filters.to_date)
  if (filters.skip !== undefined) params.set('skip', String(filters.skip))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return request(`/admin/transfers${qs ? `?${qs}` : ''}`, token)
}

export async function getPeriodStats(token: string, from_date?: string, to_date?: string): Promise<PeriodStats> {
  const params = new URLSearchParams()
  if (from_date) params.set('from_date', from_date)
  if (to_date) params.set('to_date', to_date)
  const qs = params.toString()
  return request(`/admin/stats/period${qs ? `?${qs}` : ''}`, token)
}

export async function exportTransfersCsv(token: string, filters: TransfersFilter = {}): Promise<void> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.user_id !== undefined) params.set('user_id', String(filters.user_id))
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date) params.set('to_date', filters.to_date)
  const qs = params.toString()

  const res = await fetch(`${BASE_URL}/admin/transfers/export${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zuripay-transfers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function updateTransferStatus(
  token: string, id: number, status: string, fail_reason?: string
): Promise<Transfer> {
  return request(`/admin/transfers/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(fail_reason ? { fail_reason } : {}) }),
  })
}

// ─── Rates ───────────────────────────────────────────────────────────────────

export async function getRates(token: string): Promise<Rate[]> {
  return request('/admin/rates', token)
}

export async function updateRate(token: string, from: string, to: string, rate: number): Promise<Rate> {
  return request(`/admin/rates/${from}/${to}`, token, {
    method: 'PUT',
    body: JSON.stringify({ rate }),
  })
}

export async function createRate(token: string, from_currency: string, to_currency: string, rate: number): Promise<Rate> {
  return request('/admin/rates', token, {
    method: 'POST',
    body: JSON.stringify({ from_currency, to_currency, rate }),
  })
}

export async function deleteRate(token: string, from: string, to: string): Promise<{ message: string }> {
  return request(`/admin/rates/${from}/${to}`, token, { method: 'DELETE' })
}
