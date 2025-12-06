// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma  from "../../../../src/lib/prisma"; 
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      // add user id and role to the session object returned to client
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role ?? "user";
      }
      return session;
    },
    // optionally control sign in rules:
    // async signIn({ user, account, profile }) { return true },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin", // optional - your custom signin route
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

