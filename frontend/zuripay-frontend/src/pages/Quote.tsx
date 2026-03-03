import { useState } from "react";
import { getQuote } from "../services/quoteService";
import { getErrorMessage } from "../services/api";
import type { QuoteRequest, QuoteResponse } from "../types/quote";

export default function Quote() {
  const [form, setForm] = useState<QuoteRequest>({
    send_country: "Tanzania",
    receive_country: "South Korea",
    send_amount: 100000,
    send_currency: "TZS",
    receive_currency: "KRW",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResponse | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof QuoteRequest>(key: K, value: QuoteRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setResult(null);

    try {
      const data = await getQuote(form);
      setResult({ ...data, raw: data });
      setMsg("✅ Quote received");
    } catch (err: any) {
      setMsg(`❌ ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Get Quote</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Send Country
          <input value={form.send_country} onChange={(e) => update("send_country", e.target.value)} />
        </label>

        <label>
          Receive Country
          <input value={form.receive_country} onChange={(e) => update("receive_country", e.target.value)} />
        </label>

        <label>
          Amount (in send currency)
          <input type="number" value={form.send_amount} onChange={(e) => update("send_amount", Number(e.target.value))} />
        </label>

        <label>
          Send Currency
          <input value={form.send_currency} onChange={(e) => update("send_currency", e.target.value)} placeholder="TZS" />
        </label>

        <label>
          Receive Currency
          <input value={form.receive_currency} onChange={(e) => update("receive_currency", e.target.value)} placeholder="KRW" />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Calculating..." : "Get Quote"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Quote Result</h3>
          <div style={{ background: "#f7f7f7", padding: 12, borderRadius: 4 }}>
            <p><strong>FX Rate:</strong> {result.fx_rate}</p>
            <p><strong>Fee:</strong> {result.fee_amount}</p>
            <p><strong>You Send:</strong> {result.send_amount || "N/A"}</p>
            <p><strong>You Receive:</strong> {result.receive_amount}</p>
            <p><strong>Total Cost:</strong> {result.total_cost}</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Expires At:</strong> {new Date(result.expires_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
