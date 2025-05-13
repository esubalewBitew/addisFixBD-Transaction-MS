import modules from "./imports/index";
import { type PaginateModel } from "mongoose";
import { ISession, type Session } from "../config/types/session";

const Schema = modules.mongoose.Schema;

const SessionSchema = new Schema<ISession>({
    userID: { type: Schema.Types.ObjectId, ref: 'User'},
    lastActivity: { type: Date, default: Date.now()},
    sessionExpiry: { type: Date }
});

SessionSchema.plugin(modules.paginator);

const sessionModel = modules.mongoose.model<Session, PaginateModel<Session>>(
  "Session",
  SessionSchema
);

export default sessionModel;