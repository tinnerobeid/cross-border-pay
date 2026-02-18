import { useEffect, useState } from "react";
import { listTransfers } from "../services/transferService";
import { getErrorMessage } from "../services/api";
import type { Transfer } from "../types/transfer";

export default function Transfers() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listTransfers();
      setItems(data);
    } catch (e: any) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Transfers</h2>

      <button onClick={load} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !err && (
        <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>ID</th>
              <th>Status</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{t.id}</td>
                <td>{t.status}</td>
                <td>{t.send_country} ({t.send_method})</td>
                <td>{t.receive_country} ({t.receive_method})</td>
                <td>{t.amount}</td>
                <td>{t.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
