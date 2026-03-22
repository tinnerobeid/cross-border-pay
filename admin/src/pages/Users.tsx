import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, updateUserStatus, User } from '../api'
import Badge, { roleVariant } from '../components/Badge'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Users() {
  const navigate = useNavigate()
  const token = localStorage.getItem('zuripay_admin_token') ?? ''

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError('')
    const filters: Parameters<typeof getUsers>[1] = {}
    if (debouncedSearch) filters.search = debouncedSearch
    if (activeFilter === 'active') filters.is_active = true
    if (activeFilter === 'inactive') filters.is_active = false

    getUsers(token, filters)
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, debouncedSearch, activeFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleToggleActive(e: React.MouseEvent, user: User) {
    e.stopPropagation()
    const action = user.is_active ? 'deactivate' : 'activate'
    if (user.is_active && !window.confirm(`Deactivate ${user.full_name}?`)) return
    setTogglingId(user.id)
    try {
      const updated = await updateUserStatus(token, user.id, !user.is_active)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (e: unknown) {
      alert(`Failed to ${action} user: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage registered users</p>
      </div>

      {error && (
        <div className="alert-error mb-4 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Search by name, email or phone…"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeFilter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th hidden md:table-cell">Phone</th>
                <th className="table-th">Role</th>
                <th className="table-th">Active</th>
                <th className="table-th hidden lg:table-cell">Verified</th>
                <th className="table-th hidden lg:table-cell">Joined</th>
                <th className="table-th">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="skeleton h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="table-td font-mono text-xs text-gray-400">#{user.id}</td>
                    <td className="table-td font-medium text-gray-800">{user.full_name || '—'}</td>
                    <td className="table-td text-gray-600">{user.email}</td>
                    <td className="table-td hidden md:table-cell text-gray-500">{user.phone || '—'}</td>
                    <td className="table-td">
                      <Badge label={user.role} variant={roleVariant(user.role)} />
                    </td>
                    <td className="table-td">
                      <Badge
                        label={user.is_active ? 'Active' : 'Inactive'}
                        variant={user.is_active ? 'green' : 'red'}
                      />
                    </td>
                    <td className="table-td hidden lg:table-cell">
                      <Badge
                        label={user.is_verified ? 'Yes' : 'No'}
                        variant={user.is_verified ? 'green' : 'gray'}
                      />
                    </td>
                    <td className="table-td hidden lg:table-cell text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-td">
                      <button
                        onClick={(e) => handleToggleActive(e, user)}
                        disabled={togglingId === user.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                          user.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            user.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
