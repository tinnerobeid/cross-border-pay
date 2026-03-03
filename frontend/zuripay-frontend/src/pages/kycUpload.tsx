import { useEffect, useState } from "react";
import { submitKyc, getKycStatus } from "../services/kycService";
import { getErrorMessage } from "../services/api";

export default function KycUpload() {
  const [country, setCountry] = useState("Tanzania");
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selfieFile || !idFrontFile) {
      setMsg("❌ Please upload at least selfie and ID front.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await submitKyc(
        country,
        idType,
        idNumber,
        selfieFile,
        idFrontFile,
        idBackFile || undefined
      );
      setMsg("✅ KYC submitted successfully");
      await refreshStatus();
      console.log("submit response:", res);
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
        <div style={{ background: "#f7f7f7", padding: 12, marginBottom: 16, borderRadius: 4 }}>
          <h4>Current Status</h4>
          <pre style={{ overflowX: "auto", margin: 0 }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Country
          <input value={country} onChange={(e) => setCountry(e.target.value)} />
        </label>

        <label>
          ID Type
          <input value={idType} onChange={(e) => setIdType(e.target.value)} placeholder="passport, driver_license, etc." />
        </label>

        <label>
          ID Number
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </label>

        <label>
          Selfie (required)
          <input type="file" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
        </label>

        <label>
          ID Front (required)
          <input type="file" onChange={(e) => setIdFrontFile(e.target.files?.[0] ?? null)} />
        </label>

        <label>
          ID Back (optional)
          <input type="file" onChange={(e) => setIdBackFile(e.target.files?.[0] ?? null)} />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Submitting..." : "Submit KYC"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

    </div>
  );
}
