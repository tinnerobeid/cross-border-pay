import { useEffect, useState } from 'react'
import { getRates, updateRate, createRate, deleteRate, Rate, getToken } from '../api'

interface RateRow extends Rate {
  editing: boolean
  editValue: string
  saving: boolean
}

export default function Rates() {
  const token = getToken()!
  const [rates, setRates] = useState<RateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [newRate, setNewRate] = useState('')
  const [adding, setAdding] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function load() {
    setLoading(true)
    getRates(token)
      .then(data => setRates(data.map(r => ({ ...r, editing: false, editValue: String(r.rate), saving: false }))))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  function startEdit(pair: string) {
    setRates(prev => prev.map(r => r.pair === pair ? { ...r, editing: true } : r))
  }

  function cancelEdit(pair: string) {
    setRates(prev => prev.map(r => r.pair === pair ? { ...r, editing: false, editValue: String(r.rate) } : r))
  }

  async function saveEdit(pair: string) {
    const row = rates.find(r => r.pair === pair)
    if (!row) return
    const [from, to] = pair.split('/')
    const rateVal = parseFloat(row.editValue)
    if (isNaN(rateVal) || rateVal <= 0) { setError('Rate must be a positive number'); return }
    setRates(prev => prev.map(r => r.pair === pair ? { ...r, saving: true } : r))
    try {
      const updated = await updateRate(token, from, to, rateVal)
      setRates(prev => prev.map(r => r.pair === pair ? { ...r, ...updated, editing: false, saving: false, editValue: String(updated.rate) } : r))
      showToast(`Rate ${pair} updated to ${rateVal}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
      setRates(prev => prev.map(r => r.pair === pair ? { ...r, saving: false } : r))
    }
  }

  async function doDelete(pair: string) {
    if (!window.confirm(`Remove override for ${pair}? It will revert to the live market rate.`)) return
    const [from, to] = pair.split('/')
    try {
      await deleteRate(token, from, to)
      showToast(`Override for ${pair} removed — now using live rate`)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function doAdd() {
    const rateVal = parseFloat(newRate)
    if (!newFrom || !newTo || isNaN(rateVal) || rateVal <= 0) {
      setError('Fill in all fields with valid values'); return
    }
    setAdding(true)
    try {
      await createRate(token, newFrom.toUpperCase(), newTo.toUpperCase(), rateVal)
      showToast(`Override created: ${newFrom.toUpperCase()}/${newTo.toUpperCase()} = ${rateVal}`)
      setNewFrom(''); setNewTo(''); setNewRate(''); setShowAdd(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Exchange Rates</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live rates from exchangerate.host · refresh every hour</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Override
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div>
          <p className="font-semibold">Rate Priority: Admin Override → Live API → Fallback</p>
          <p className="text-blue-600 text-xs mt-0.5">Override rates take full priority until manually removed. Live rates are cached for 1 hour. Restart the backend to clear the cache.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Add override form */}
      {showAdd && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Add Rate Override</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">From Currency</label>
              <input type="text" placeholder="TZS" value={newFrom} onChange={e => setNewFrom(e.target.value)} className="input-field uppercase" maxLength={4} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">To Currency</label>
              <input type="text" placeholder="KRW" value={newTo} onChange={e => setNewTo(e.target.value)} className="input-field uppercase" maxLength={4} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rate (1 FROM = ? TO)</label>
              <input type="number" placeholder="0.055" step="any" value={newRate} onChange={e => setNewRate(e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-2">
              <button onClick={doAdd} disabled={adding} className="btn-primary flex-1 justify-center">
                {adding ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rates table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="th">Currency Pair</th>
                <th className="th">Rate (1 unit)</th>
                <th className="th">Source</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {[...Array(4)].map((_, j) => <td key={j} className="td"><div className="skeleton h-4 w-24" /></td>)}
                  </tr>
                ))
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No rates loaded</td>
                </tr>
              ) : rates.map(r => {
                const [from, to] = r.pair.split('/')
                return (
                  <tr key={r.pair} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{from}</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        <span className="font-mono font-bold text-slate-800">{to}</span>
                      </div>
                    </td>
                    <td className="td">
                      {r.editing ? (
                        <input
                          type="number"
                          step="any"
                          value={r.editValue}
                          onChange={e => setRates(prev => prev.map(x => x.pair === r.pair ? { ...x, editValue: e.target.value } : x))}
                          className="input-field w-36 font-mono text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-slate-700">{r.rate}</span>
                      )}
                    </td>
                    <td className="td">
                      {r.is_override ? (
                        <span className="badge bg-blue-100 text-blue-700">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-1" />
                          Override
                        </span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-700">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse" />
                          Live
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {r.editing ? (
                          <>
                            <button onClick={() => saveEdit(r.pair)} disabled={r.saving} className="btn-success text-xs py-1.5">
                              {r.saving ? 'Saving…' : '✓ Save'}
                            </button>
                            <button onClick={() => cancelEdit(r.pair)} className="btn-ghost text-xs py-1.5">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(r.pair)} className="btn-ghost text-xs py-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit
                            </button>
                            {r.is_override && (
                              <button onClick={() => doDelete(r.pair)} className="btn-danger text-xs py-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
