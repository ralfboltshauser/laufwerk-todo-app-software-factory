import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "Laufwerk Todos",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: { enabled: true },
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "laufwerk-todo-app-software-factory.vercel.app",
      "laufwerk-todo-app-software-factory-*.vercel.app",
    ],
    protocol: "auto",
  },
  plugins: [nextCookies()],
});
