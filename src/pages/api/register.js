import { users } from "../../lib/users";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { name, email, password } = req.body;

    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    users.push({ id: Date.now().toString(), name, email, password });
    return res.status(200).json({ message: "User registered successfully" });
  }

  res.status(405).json({ message: "Method not allowed" });
}
