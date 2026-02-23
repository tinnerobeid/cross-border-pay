import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

import Login from "./pages/Login";
import CreateTransfer from "./pages/CreateTransfer";
import Transfers from "./pages/Transfers";
import Quote from "./pages/Quote";
import KycUpload from "./pages/KycUpload";

function NavBar() {
  const nav = useNavigate();
  const token = localStorage.getItem("access_token");

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    nav("/login");
  }

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", gap: 12 }}>
      <Link to="/login">Login</Link>
      <Link to="/transfer/new">Create Transfer</Link>
      <Link to="/transfers">Transfers</Link>
      <Link to="/quote">Quote</Link>
      <Link to="/kyc">KYC</Link>

      <div style={{ marginLeft: "auto" }}>
        {token ? <button onClick={logout}>Logout</button> : <span style={{ fontSize: 12 }}>Not logged in</span>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        {/* ✅ Default route goes to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/transfer/new" element={<CreateTransfer />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/kyc" element={<KycUpload />} />

        {/* ✅ Any unknown route goes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
