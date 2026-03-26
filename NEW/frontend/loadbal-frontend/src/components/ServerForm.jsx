import { useState } from "react";
import { addServer } from "../api/orgApi";

export default function ServerForm({ orgId, onAdded }) {
  const [url, setUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await addServer(orgId, { url });
    onAdded(orgId, res.data.servers[res.data.servers.length - 1]);
    setUrl("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 10 }}>
      <input
        type="url"
        placeholder="Server URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button type="submit">Add Server</button>
    </form>
  );
}