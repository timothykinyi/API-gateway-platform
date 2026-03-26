import OrgForm from "../components/OrgForm";
import OrgList from "../components/OrgList";

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Load Balancer Dashboard</h1>
      <OrgForm onCreated={() => window.location.reload()} />
      <OrgList />
    </div>
  );
}