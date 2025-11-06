import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./auth.db"),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5分
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
