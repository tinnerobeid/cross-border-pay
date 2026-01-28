import { useState } from "react";
import { createTransfer } from "../services/transfers";

export default function CreateTransfer() {
  const [msg, setMsg] = useState("");
  const [send_amount, setAmount] = useState(100000);

  async function onCreate() {
    setMsg("");
    try {
      const data = await createTransfer({
        send_country: "TZ",
        receive_country: "KR",
        send_method: "mobile_money",
        receive_method: "bank",
        send_amount,
        send_currency: "TZS",
        receive_currency: "KRW",
      });
      setMsg(`Created transfer #${data.id} (status: ${data.status})`);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Create failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Create Transfer</h2>
      <label>Send amount (TZS)</label>
      <input type="number" value={send_amount} onChange={(e)=>setAmount(Number(e.target.value))} style={{ width: "100%", marginBottom: 8 }} />
      <button onClick={onCreate}>Create</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
