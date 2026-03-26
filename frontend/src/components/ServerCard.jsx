import { api } from "../services/api";

export default function ServerCard({ server, refresh }) {

  const wake = async () => {
    await api.post(`/admin/server/${server._id}/wake`);
    refresh();
  };

  const sleep = async () => {
    await api.post(`/admin/server/${server._id}/sleep`);
    refresh();
  };

  const getColor = () => {
    if (server.status === "active") return "green";
    if (server.status === "sleeping") return "orange";
    return "red";
  };

  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "15px",
      borderRadius: "10px",
      width: "250px"
    }}>
      <h3>{server.url}</h3>
      <p>Status: <span style={{ color: getColor() }}>
        {server.status}
      </span></p>

      <button onClick={wake}>Wake</button>
      <button onClick={sleep}>Sleep</button>
    </div>
  );
}