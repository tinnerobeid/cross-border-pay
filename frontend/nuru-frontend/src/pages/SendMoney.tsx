import { useState } from "react";
import { createTransfer } from "../services/transferService";
import type { TransferCreate } from "../types/transfer";

export default function SendMoney() {
  const [form, setForm] = useState<TransferCreate>({
    send_country: "Tanzania",
    receive_country: "South Korea",
    send_method: "mobile_money",
    receive_method: "bank",
    amount: 10000,
    currency: "TZS",
    recipient_name: "",
    recipient_phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof TransferCreate>(key: K, value: TransferCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const created = await createTransfer(form);
      setMsg(`✅ Transfer created. ID: ${created.id}, status: ${created.status}`);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create transfer";
      setMsg(`❌ ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Create Transfer</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Send country
          <input
            value={form.send_country}
            onChange={(e) => update("send_country", e.target.value)}
          />
        </label>

        <label>
          Receive country
          <input
            value={form.receive_country}
            onChange={(e) => update("receive_country", e.target.value)}
          />
        </label>

        <label>
          Send method
          <select
            value={form.send_method}
            onChange={(e) => update("send_method", e.target.value)}
          >
            <option value="mobile_money">mobile_money</option>
            <option value="bank">bank</option>
            <option value="card">card</option>
          </select>
        </label>

        <label>
          Receive method
          <select
            value={form.receive_method}
            onChange={(e) => update("receive_method", e.target.value)}
          >
            <option value="bank">bank</option>
            <option value="mobile_money">mobile_money</option>
            <option value="wallet">wallet</option>
          </select>
        </label>

        <label>
          Amount
          <input
            type="number"
            value={form.amount}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
        </label>

        <label>
          Currency
          <input
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
          />
        </label>

        <label>
          Recipient name
          <input
            value={form.recipient_name || ""}
            onChange={(e) => update("recipient_name", e.target.value)}
          />
        </label>

        <label>
          Recipient phone
          <input
            value={form.recipient_phone || ""}
            onChange={(e) => update("recipient_phone", e.target.value)}
          />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Transfer"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
