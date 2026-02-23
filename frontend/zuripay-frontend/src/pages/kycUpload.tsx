import { useEffect, useState } from "react";
import { uploadKycDocument, getKycStatus } from "../services/kycService";
import { getErrorMessage } from "../services/api";

export default function KycUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshStatus() {
    try {
      const data = await getKycStatus();
      setStatus(data);
    } catch (e: any) {
      setMsg(`❌ ${getErrorMessage(e)}`);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function onUpload() {
    if (!file) {
      setMsg("❌ Please choose a file first.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await uploadKycDocument(file);
      setMsg("✅ Uploaded successfully");
      await refreshStatus();
      console.log("upload response:", res);
    } catch (e: any) {
      setMsg(`❌ ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>KYC Upload</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={refreshStatus} disabled={loading}>Refresh Status</button>
      </div>

      {status && (
        <pre style={{ background: "#f7f7f7", padding: 12, overflowX: "auto" }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={onUpload} disabled={loading || !file}>
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.8 }}>
        This uses <code>multipart/form-data</code>. If your backend expects a different field name than <code>file</code>, tell me and I’ll adjust.
      </p>
    </div>
  );
}
