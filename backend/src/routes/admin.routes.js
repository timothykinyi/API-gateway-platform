async function adminRoutes(app) {
  const Org = require("../models/Org");
  const Server = require("../models/Server");

  // Create Org
  app.post("/admin/org", async (req, reply) => {
    const org = await Org.create(req.body);
    return org;
  });

  // Add Servers
  app.post("/admin/servers", async (req, reply) => {
    const servers = await Server.insertMany(req.body.servers);
    return servers;
  });
}

module.exports = adminRoutes;