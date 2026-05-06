import { Schema, Types, model, models, type InferSchemaType } from "mongoose";

export const ISSUE_STATUSES = ["To Do", "In Progress", "Done"] as const;
export const ISSUE_PRIORITIES = ["Low", "Medium", "High"] as const;

const commentSchema = new Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    actor: { type: Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    field: { type: String },
    from: { type: String },
    to: { type: String },
  },
  { timestamps: true },
);

const issueSchema = new Schema(
  {
    project: { type: Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ISSUE_STATUSES, default: "To Do", index: true },
    priority: { type: String, enum: ISSUE_PRIORITIES, default: "Medium", index: true },
    assignee: { type: Types.ObjectId, ref: "User" },
    assigneeName: { type: String, default: "" },
    reporter: { type: Types.ObjectId, ref: "User", required: true },
    reporterName: { type: String, required: true },
    dueDate: { type: Date },
    comments: [commentSchema],
    activity: [activitySchema],
  },
  { timestamps: true },
);

issueSchema.index({ title: "text", description: "text" });
issueSchema.index({ project: 1, status: 1, priority: 1, assignee: 1 });

export type IssueDocument = InferSchemaType<typeof issueSchema> & { _id: string };
export const Issue = models.Issue || model("Issue", issueSchema);
