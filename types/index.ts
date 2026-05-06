export type Status = "To Do" | "In Progress" | "Done";
export type Priority = "Low" | "Medium" | "High";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Project = {
  _id: string;
  name: string;
  key: string;
  description?: string;
};

export type Comment = {
  _id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type Activity = {
  _id: string;
  actorName: string;
  action: string;
  field?: string;
  from?: string;
  to?: string;
  createdAt: string;
};

export type Issue = {
  _id: string;
  id?: string;
  project?: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignee?: string;
  assigneeName?: string;
  reporterName?: string;
  dueDate?: string;
  comments?: Comment[];
  activity?: Activity[];
  isDefault?: false;
};

export type DefaultTask = {
  id: `default-${number}`;
  title: string;
  status: Status;
  priority: Priority;
  description?: string;
  assignee?: string;
  assigneeName?: string;
  isDefault: true;
};

export type BoardItem = Issue | DefaultTask;
