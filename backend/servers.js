const servers = [
  {
    id: "server1",
    url: "http://localhost:3001",
    status: "active",   // active | sleeping | dead
    alive: true,
    lastUsed: Date.now()
  },
  {
    id: "server2",
    url: "http://localhost:3002",
    status: "active",   // active | sleeping | dead
    alive: true,
    lastUsed: Date.now()
  }

];

module.exports = servers;