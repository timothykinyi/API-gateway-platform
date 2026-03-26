import { useEffect, useState } from "react";
import { api } from "../services/api";
import ServerCard from "../components/ServerCard";
import MetricsPanel from "../components/MetricsPanel";

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [orgId, setOrgId] = useState("");

  // 🔹 Fetch servers
  const fetchServers = async () => {
    if (!orgId) return;

    const res = await api.get(`/admin/servers?orgId=${orgId}`);
    setServers(res.data);
  };

  // 🔹 Fetch metrics
  const fetchMetrics = async () => {
    const res = await api.get("/admin/metrics");
    setMetrics(res.data);
  };

  // 🔁 Polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServers();
      fetchMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, [orgId]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Load Balancer Dashboard</h1>

      {/* Org Input */}
      <input
        placeholder="Enter Org ID"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
      />

      <button onClick={fetchServers}>Load Servers</button>

      {/* Metrics */}
      <MetricsPanel metrics={metrics} />

      {/* Servers */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        {servers.map(server => (
          <ServerCard
            key={server._id}
            server={server}
            refresh={fetchServers}
          />
        ))}
      </div>
    </div>
  );
}