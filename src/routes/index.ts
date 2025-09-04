const debug = require("debug")("api:routes");
import transactionRoutes from "./transaction.routes";

export default function initRoutes(app:any) {
  debug("loading routes");
  app.use("/addisfix/transaction", transactionRoutes);
};
