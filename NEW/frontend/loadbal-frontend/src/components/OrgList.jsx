import { useEffect, useState } from "react";
import { getOrgs } from "../api/orgApi";
import ServerList from "./ServerList";
import ServerForm from "./ServerForm";

export default function OrgList() {
  const [orgs, setOrgs] = useState([]);

  const fetchOrgs = async () => {
    const res = await getOrgs();
    setOrgs(res.data);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleServerAdded = (orgId, server) => {
    setOrgs((prev) =>
      prev.map((org) =>
        org._id === orgId ? { ...org, servers: [...org.servers, server] } : org
      )
    );
  };

  return (
    <div>
      {orgs.map((org) => (
        <div key={org._id} style={{ border: "1px solid #ccc", padding: 10, margin: 10 }}>
          <h3>{org.name}</h3>
          <p>API Key: {org.apiKey}</p>

          <ServerForm orgId={org._id} onAdded={handleServerAdded} />
          <ServerList org={org} />
        </div>
      ))}
    </div>
  );
}