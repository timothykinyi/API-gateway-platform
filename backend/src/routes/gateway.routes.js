async function routes(app) {
  const { handleRequest } = require("../controllers/gateway.controller");

  app.all("/*", handleRequest);
}

module.exports = routes;