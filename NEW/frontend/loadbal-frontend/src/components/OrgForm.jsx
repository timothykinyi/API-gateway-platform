import { useState } from "react";
import { createOrg } from "../api/orgApi";

export default function OrgForm({ onCreated }) {
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createOrg({ name });
    onCreated(res.data);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Organization Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Create Org</button>
    </form>
  );
}