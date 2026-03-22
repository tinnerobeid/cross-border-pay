import { useEffect, useState } from 'react'
import { getRates, updateRate, createRate, deleteRate, Rate } from '../api'

interface RateRow extends Rate {
  editValue: string
  saving: boolean
  dirty: boolean
}

interface NewRateForm {
  from_currency: string
  to_currency: string
  rate: string
}

export default function Rates() {
  const token = localStorage.getItem('zuripay_admin_token') ?? ''

  const [rows, setRows] = useState<RateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newRate, setNewRate] = useState<NewRateForm>({ from_currency: '', to_currency: '', rate: '' })
  const [addingRate, setAddingRate] = useState(false)
  const [addError, setAddError] = useState('')

  function fetchRates() {
    setLoading(true)
    setError('')
    getRates(token)
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            editValue: String(r.rate),
            saving: false,
            dirty: false,
          }))
        )
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRates() }, [])

  function handleEditChange(pair: string, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.pair === pair
          ? { ...r, editValue: value, dirty: value !== String(r.rate) }
          : r
      )
    )
  }

  async function handleSave(row: RateRow) {
    const parsed = parseFloat(row.editValue)
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid positive number for the rate.')
      return
    }

    const [from, to] = row.pair.split('/')
    if (!from || !to) {
      alert('Invalid currency pair format.')
      return
    }

    setRows((prev) => prev.map((r) => (r.pair === row.pair ? { ...r, saving: true } : r)))

    try {
      const updated = await updateRate(token, from, to, parsed)
      setRows((prev) =>
        prev.map((r) =>
          r.pair === row.pair
            ? { ...r, rate: updated.rate, editValue: String(updated.rate), saving: false, dirty: false }
            : r
        )
      )
      setSuccessMsg(`Rate ${row.pair} updated to ${parsed}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: unknown) {
      alert(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`)
      setRows((prev) => prev.map((r) => (r.pair === row.pair ? { ...r, saving: false } : r)))
    }
  }

  async function handleDelete(pair: string) {
    if (!window.confirm(`Delete rate ${pair}? This cannot be undone.`)) return
    const [from, to] = pair.split('/')
    if (!from || !to) return

    setRows((prev) => prev.map((r) => (r.pair === pair ? { ...r, saving: true } : r)))

    try {
      await deleteRate(token, from, to)
      setRows((prev) => prev.filter((r) => r.pair !== pair))
      setSuccessMsg(`Rate ${pair} deleted.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: unknown) {
      alert(`Failed to delete: ${e instanceof Error ? e.message : 'Unknown error'}`)
      setRows((prev) => prev.map((r) => (r.pair === pair ? { ...r, saving: false } : r)))
    }
  }

  async function handleAddRate() {
    setAddError('')
    const parsed = parseFloat(newRate.rate)
    if (!newRate.from_currency.trim()) return setAddError('From currency is required.')
    if (!newRate.to_currency.trim()) return setAddError('To currency is required.')
    if (isNaN(parsed) || parsed <= 0) return setAddError('Rate must be a valid positive number.')

    setAddingRate(true)
    try {
      const created = await createRate(
        token,
        newRate.from_currency.toUpperCase().trim(),
        newRate.to_currency.toUpperCase().trim(),
        parsed
      )
      setRows((prev) => [
        ...prev,
        { ...created, editValue: String(created.rate), saving: false, dirty: false },
      ])
      setNewRate({ from_currency: '', to_currency: '', rate: '' })
      setShowAddForm(false)
      setSuccessMsg(`Rate ${created.pair} added.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to add rate.')
    } finally {
      setAddingRate(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Exchange Rates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage currency pair exchange rates</p>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddError('') }}
          className="btn-primary"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Rate'}
        </button>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2 text-sm text-amber-800">
        <span>⚠</span>
        <span>
          <strong>In-memory only</strong> — rates reset on server restart. Make sure to persist them in your database if needed.
        </span>
      </div>

      {error && <div className="alert-error mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}
      {successMsg && <div className="alert-success mb-4 flex items-center gap-2"><span>✅</span> {successMsg}</div>}

      {/* Add rate form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Add New Rate</h3>
          {addError && <div className="alert-error mb-3 text-xs">{addError}</div>}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Currency</label>
              <input
                type="text"
                value={newRate.from_currency}
                onChange={(e) => setNewRate((r) => ({ ...r, from_currency: e.target.value }))}
                className="input-field w-28 uppercase"
                placeholder="TZS"
                maxLength={5}
                disabled={addingRate}
              />
            </div>
            <div className="text-gray-400 text-xl pb-1">→</div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Currency</label>
              <input
                type="text"
                value={newRate.to_currency}
                onChange={(e) => setNewRate((r) => ({ ...r, to_currency: e.target.value }))}
                className="input-field w-28 uppercase"
                placeholder="KRW"
                maxLength={5}
                disabled={addingRate}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
              <input
                type="number"
                value={newRate.rate}
                onChange={(e) => setNewRate((r) => ({ ...r, rate: e.target.value }))}
                className="input-field w-36"
                placeholder="0.00"
                step="any"
                min="0"
                disabled={addingRate}
              />
            </div>
            <button
              onClick={handleAddRate}
              disabled={addingRate}
              className="btn-primary"
            >
              {addingRate ? 'Adding…' : 'Add Rate'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Pair will be created as{' '}
            <code className="bg-gray-100 px-1 rounded">
              {(newRate.from_currency || 'FROM').toUpperCase()}/{(newRate.to_currency || 'TO').toUpperCase()}
            </code>
          </p>
        </div>
      )}

      {/* Rates table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th w-8">#</th>
                <th className="table-th">Currency Pair</th>
                <th className="table-th">From</th>
                <th className="table-th">To</th>
                <th className="table-th">Current Rate</th>
                <th className="table-th">Edit Rate</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="skeleton h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">💱</div>
                    <p className="font-medium">No exchange rates configured</p>
                    <p className="text-sm">Add a rate using the button above</p>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const [from, to] = row.pair.split('/')
                  return (
                    <tr key={row.pair} className="table-row">
                      <td className="table-td text-xs text-gray-400">{idx + 1}</td>
                      <td className="table-td">
                        <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-sm">
                          {row.pair}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="font-mono text-sm font-medium text-blue-600">{from}</span>
                      </td>
                      <td className="table-td">
                        <span className="font-mono text-sm font-medium text-green-600">{to}</span>
                      </td>
                      <td className="table-td">
                        <span className="font-mono text-sm text-gray-700">
                          {row.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={row.editValue}
                            onChange={(e) => handleEditChange(row.pair, e.target.value)}
                            className={`input-field w-36 font-mono ${row.dirty ? 'border-blue-400 ring-1 ring-blue-200' : ''}`}
                            step="any"
                            min="0"
                            disabled={row.saving}
                          />
                          {row.dirty && (
                            <span className="text-xs text-blue-500 whitespace-nowrap">unsaved</span>
                          )}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSave(row)}
                            disabled={row.saving || !row.dirty}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                              row.dirty && !row.saving
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {row.saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => handleDelete(row.pair)}
                            disabled={row.saving}
                            className="btn-danger text-xs px-2.5 py-1.5"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            {rows.length} rate pair{rows.length !== 1 ? 's' : ''} configured
          </div>
        )}
      </div>
    </div>
  )
}
