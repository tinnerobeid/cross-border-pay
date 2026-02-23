import { useState } from "react";

export default function TestPage() {
  const [msg, setMsg] = useState("App loaded successfully!");

  return (
    <div style={{ padding: 24 }}>
      <h1>Test Page</h1>
      <p>{msg}</p>
      <button onClick={() => setMsg("Button clicked!")}>Click me</button>
    </div>
  );
}
