export default function MetricsPanel({ metrics }) {
  return (
    <div style={{
      display: "flex",
      gap: "20px",
      marginBottom: "20px"
    }}>
      <div>RPS: {metrics.rps}</div>
      <div>Avg Response: {metrics.avgResponseTime?.toFixed(2)} ms</div>
    </div>
  );
}