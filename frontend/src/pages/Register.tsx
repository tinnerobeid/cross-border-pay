import { useState } from "react";
import { register } from "../services/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await register(email, password);
      nav("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Register failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input placeholder="Password (min 8)" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}
      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}
