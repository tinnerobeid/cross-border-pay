import { useEffect, useState } from "react";
import { getHealth } from "../services/healthService";

export default function Home() {
  const [status, setStatus] = useState<string>("checking...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getHealth();
        setStatus(JSON.stringify(data));
      } catch (e: any) {
        setError(e?.response?.data?.detail || e?.message || "Failed to connect");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Nuru</h1>
      <p><b>Backend health:</b> {status}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
