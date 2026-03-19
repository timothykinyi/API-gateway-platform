let requestCount = 0;
let totalResponseTime = 0;

function recordRequest(duration) {
  requestCount++;
  totalResponseTime += duration;
}

function getMetrics() {
  const avg = requestCount === 0 ? 0 : totalResponseTime / requestCount;

  return {
    rps: requestCount,
    avgResponseTime: avg
  };
}

function resetMetrics() {
  requestCount = 0;
  totalResponseTime = 0;
}

module.exports = { recordRequest, getMetrics, resetMetrics };