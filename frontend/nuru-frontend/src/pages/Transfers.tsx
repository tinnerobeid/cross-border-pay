import { useEffect, useState } from "react";
import { listTransfers } from "../services/transferService";
import type { Transfer } from "../types/transfer";

export default function Transfers() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listTransfers();
        setItems(data);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || e?.message || "Failed to load transfers");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Transfers</h2>

      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && !err && (
        <table cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
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
              <tr key={t.id}>
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
