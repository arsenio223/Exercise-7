import Credentials from "next-auth/providers/credentials";
import { users } from "./users";

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Find user from "database"
        const user = users.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return { id: user.id, name: user.name, email: user.email };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
};
