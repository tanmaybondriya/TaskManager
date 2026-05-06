import { User } from "@/server/models/User";

export async function listUsers() {
  const users = await User.find({}).select("_id name email").sort({ name: 1 }).lean();

  return users.map((user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
  }));
}
