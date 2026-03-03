import { useState } from "react";
import { createTransfer } from "../services/transferService";
import { getErrorMessage } from "../services/api";
import type { TransferCreate } from "../types/transfer";

export default function CreateTransfer() {
  const [form, setForm] = useState<TransferCreate>({
    send_country: "Tanzania",
    receive_country: "South Korea",
    send_currency: "TZS",
    receive_currency: "KRW",
    send_amount: 100000,
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
      setMsg(`✅ Transfer created. ID=${created.id}, status=${created.status}`);
    } catch (err: any) {
      setMsg(`❌ ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Create Transfer</h2>

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
          Send Currency
          <input value={form.send_currency} onChange={(e) => update("send_currency", e.target.value)} placeholder="TZS" />
        </label>

        <label>
          Receive Currency
          <input value={form.receive_currency} onChange={(e) => update("receive_currency", e.target.value)} placeholder="KRW" />
        </label>

        <label>
          Amount (in send currency)
          <input type="number" value={form.send_amount} onChange={(e) => update("send_amount", Number(e.target.value))} />
        </label>

        <label>
          Recipient Name
          <input value={form.recipient_name} onChange={(e) => update("recipient_name", e.target.value)} placeholder="Full name" required />
        </label>

        <label>
          Recipient Phone
          <input value={form.recipient_phone} onChange={(e) => update("recipient_phone", e.target.value)} placeholder="+234..." required />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Transfer"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
