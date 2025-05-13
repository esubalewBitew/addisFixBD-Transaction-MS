const debug = require("debug")("api:routes");

import authRoutes from "./auth.routes";

export default function initRoutes(app:any) {
  debug("loading routes");
  app.use("/addisfix/auth", authRoutes);
};
