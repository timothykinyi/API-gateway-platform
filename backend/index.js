require("dotenv").config();

const app = require("./src/app");

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Gateway running on http://localhost:3000");
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

start();