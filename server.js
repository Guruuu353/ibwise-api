const app = require("./src/app");
const { port, nodeEnv } = require("./src/config/env");

const server = app.listen(port, () => {
  console.log(`IBWISE API listening on :${port} [${nodeEnv}]`);
});

// Fail loudly instead of hanging on an unhandled rejection in production.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  server.close(() => process.exit(1));
});
