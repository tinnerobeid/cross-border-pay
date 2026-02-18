import { useState } from "react";
import { getQuote } from "../services/quoteService";
import { getErrorMessage } from "../services/api";
import type { QuoteRequest, QuoteResponse } from "../types/quote";

export default function Quote() {
  const [form, setForm] = useState<QuoteRequest>({
    send_country: "Tanzania",
    receive_country: "South Korea",
    amount: 10000,
    currency: "TZS",
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
          Send country
          <input value={form.send_country} onChange={(e) => update("send_country", e.target.value)} />
        </label>

        <label>
          Receive country
          <input value={form.receive_country} onChange={(e) => update("receive_country", e.target.value)} />
        </label>

        <label>
          Amount
          <input type="number" value={form.amount} onChange={(e) => update("amount", Number(e.target.value))} />
        </label>

        <label>
          Currency
          <input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Calculating..." : "Get Quote"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Quote Result</h3>
          <pre style={{ background: "#f7f7f7", padding: 12, overflowX: "auto" }}>
            {JSON.stringify(result.raw ?? result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
