const debug = require("debug")("api:routes");

import authRoutes from "./auth.routes";
import transactionRoutes from "./transaction.routes";

export default function initRoutes(app:any) {
  debug("loading routes");
  app.use("/addisfix/services", authRoutes);
  app.use("/addisfix/transactions", transactionRoutes);
};
