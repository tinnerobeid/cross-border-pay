import { useEffect, useState } from "react";
import { getTransfer, updateTransferStatus } from "../services/transfers";
import { useParams } from "react-router-dom";

export default function TransferDetail() {
  const { id } = useParams();
  const transferId = Number(id);
  const [t, setT] = useState<any>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const data = await getTransfer(transferId);
      setT(data);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Load failed");
    }
  }

  async function setStatus(status: string) {
    setMsg("");
    try {
      const data = await updateTransferStatus(transferId, status);
      setT(data);
      setMsg(`Updated to ${status}`);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Update failed");
    }
  }

  useEffect(() => { load(); }, []);

  if (!t) return <div style={{ padding: 24 }}>{msg || "Loading..."}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Transfer #{t.id}</h2>
      <pre>{JSON.stringify(t, null, 2)}</pre>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={()=>setStatus("processing")}>processing</button>
        <button onClick={()=>setStatus("sent")}>sent</button>
        <button onClick={()=>setStatus("received")}>received</button>
        <button onClick={()=>setStatus("failed")}>failed</button>
      </div>
      {msg && <p>{msg}</p>}
    </div>
  );
}
