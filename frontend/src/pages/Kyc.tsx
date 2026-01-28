import { useState } from "react";
import { submitKyc, upsertKyc } from "../services/kyc";

export default function Kyc() {
  // MVP: user_id is manual until we add /me
  const userId = Number(localStorage.getItem("user_id") || "1");

  const [full_name, setFullName] = useState("");
  const [nationality, setNationality] = useState("Tanzanian");
  const [id_type, setIdType] = useState("passport");
  const [id_number, setIdNumber] = useState("");
  const [msg, setMsg] = useState("");

  async function onSave() {
    setMsg("");
    try {
      const data = await upsertKyc(userId, { full_name, nationality, id_type, id_number });
      setMsg(`Saved. Status: ${data.status}`);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Save failed");
    }
  }

  async function onSubmit() {
    setMsg("");
    try {
      const data = await submitKyc(userId);
      setMsg(`Submitted. Status: ${data.status}`);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Submit failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>KYC</h2>
      <p>MVP note: user_id is currently set to {userId}.</p>
      <input placeholder="Full name" value={full_name} onChange={(e)=>setFullName(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <input placeholder="Nationality" value={nationality} onChange={(e)=>setNationality(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <input placeholder="ID Type" value={id_type} onChange={(e)=>setIdType(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <input placeholder="ID Number" value={id_number} onChange={(e)=>setIdNumber(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <button onClick={onSave} style={{ marginRight: 8 }}>Save</button>
      <button onClick={onSubmit}>Submit</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
