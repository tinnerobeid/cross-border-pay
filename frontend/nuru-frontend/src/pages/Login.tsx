import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const data = await login({ email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token_type", data.token_type || "bearer");
      setMsg("✅ Logged in!");
      nav("/transfers");
    } catch (err: any) {
      setMsg(`❌ ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        Token is saved in <code>localStorage</code> as <code>access_token</code>.
      </p>
    </div>
  );
}
