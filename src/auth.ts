import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Pseudo", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials.username as string;
        if (!username || username.trim().length === 0) return null;

        const user = await prisma.user.upsert({
          where: { username },
          update: {},
          create: { username },
        });

        return { id: user.id, name: user.username };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
