const Org = require("../models/org.model");
const crypto = require("crypto");

// Generate API Key
const generateApiKey = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Create Org
exports.createOrg = async (req, res) => {
  try {
    const { name } = req.body;

    const org = await Org.create({
      name,
      apiKey: generateApiKey(),
      servers: []
    });

    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Orgs
exports.getOrgs = async (req, res) => {
  try {
    const orgs = await Org.find();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Server
exports.addServer = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { url } = req.body;

    const org = await Org.findById(orgId);

    if (!org) return res.status(404).json({ error: "Org not found" });

    org.servers.push({ url });

    await org.save();

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Server URL
exports.updateServer = async (req, res) => {
  try {
    const { orgId, serverId } = req.params;
    const { url } = req.body;

    const org = await Org.findById(orgId);

    const server = org.servers.id(serverId);
    if (!server) return res.status(404).json({ error: "Server not found" });

    server.url = url;

    await org.save();

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove Server
exports.removeServer = async (req, res) => {
  try {
    const { orgId, serverId } = req.params;

    const org = await Org.findById(orgId);

    org.servers = org.servers.filter(
      (s) => s._id.toString() !== serverId
    );

    await org.save();

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrgServers = async (req, res) => {
  try {
    const { orgId } = req.params;
    const org = await Org.findById(orgId);
    if (!org) return res.status(404).json({ error: "Org not found" });

    res.json(org.servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};