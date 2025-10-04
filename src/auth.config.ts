import type { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { getUser } from "@/lib/database";

export const authConfig: NextAuthConfig = {
  // Configure one or more authentication providers
  // More info: https://next-auth.js.org/providers/
  providers: [
    // Use GitHub authentication
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],

  trustHost: true,
};
