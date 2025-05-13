import { Schema, model } from "mongoose";

interface IHitCount {
  path: string;
  method: string;
  count: number;
  status: {
    success: number;
    error: number;
  };
  queries: string[];
}

const hitCountSchema = new Schema<IHitCount>(
  {
    path: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    count: { type: Number, required: true, default: 1 },
    status: {
      success: { type: Number, required: true, default: 0 },
      error: { type: Number, required: true, default: 0 },
    },
    queries: [{ type: String }],
  },
  { timestamps: true }
);

const HitCount = model<IHitCount>("HitCount", hitCountSchema);

export default HitCount;
