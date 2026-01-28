import { useState } from "react";
import { login } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const data = await login(email, password);
      localStorage.setItem("access_token", data.access_token);
      nav("/transfers");
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Login failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <button type="submit">Login</button>
      </form>
      {msg && <p>{msg}</p>}
      <p><Link to="/register">Create account</Link></p>
    </div>
  );
}
