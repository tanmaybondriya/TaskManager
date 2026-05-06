import { Schema, Types, model, models, type InferSchemaType } from "mongoose";

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

projectSchema.index({ owner: 1, key: 1 }, { unique: true });

export type ProjectDocument = InferSchemaType<typeof projectSchema> & { _id: string };
export const Project = models.Project || model("Project", projectSchema);
