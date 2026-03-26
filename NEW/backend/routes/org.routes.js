const express = require("express");
const router = express.Router();

const {
  createOrg,
  getOrgs,
  addServer,
  updateServer,
  removeServer,
  getOrgServers,
  
} = require("../controllers/org.controller");

router.post("/", createOrg);
router.get("/", getOrgs);

router.post("/:orgId/servers", addServer);
router.get("/:orgId/servers", getOrgServers);
router.put("/:orgId/servers/:serverId", updateServer);
router.delete("/:orgId/servers/:serverId", removeServer);

module.exports = router;