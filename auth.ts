import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";
import authConfig from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/db";
import { getUserById } from "./data/user";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      // if (existingUser.isTwoFactorEnabled) {
      //   const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
      //     existingUser.id
      //   );

      //   if (!twoFactorConfirmation) return false;

      //   // Delete two factor confirmation for next sign in
      //   await db.twoFactorConfirmation.delete({
      //     where: { id: twoFactorConfirmation.id },
      //   });
      // }
      return true;
    },
    async jwt({ token, user }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      token.role = existingUser.role;

      console.log({ token });
      return token;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      console.log({ sessionToken: token, session });

      return session;
    },
  },
  ...authConfig,
  session: { strategy: "jwt" },
});
