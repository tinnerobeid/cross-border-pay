import { useEffect, useState } from "react";
import { listTransfers } from "../services/transfers";
import { Link } from "react-router-dom";

export default function Transfers() {
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const data = await listTransfers();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Load failed");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Transfers</h2>
      <p>
        <Link to="/create-transfer">Create Transfer</Link> |{" "}
        <Link to="/kyc">KYC</Link>
      </p>
      <button onClick={load}>Refresh</button>
      {msg && <p>{msg}</p>}
      <ul>
        {items.map((t) => (
          <li key={t.id}>
            <Link to={`/transfers/${t.id}`}>#{t.id}</Link> — {t.status} — {t.send_amount} {t.send_currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
