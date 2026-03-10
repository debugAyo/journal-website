import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-only-secret-change-in-production" : undefined);

// CRITICAL: On Vercel, if NEXTAUTH_URL is still set to localhost, override it
// NextAuth v5 reads AUTH_URL / NEXTAUTH_URL directly from process.env
if (process.env.VERCEL_URL) {
  const correctUrl = `https://${process.env.VERCEL_URL}`;
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    process.env.NEXTAUTH_URL = correctUrl;
  }
  if (!process.env.AUTH_URL || process.env.AUTH_URL.includes("localhost")) {
    process.env.AUTH_URL = correctUrl;
  }
}

const isProduction = process.env.NODE_ENV === "production";

console.log("[AUTH CONFIG]", {
  AUTH_URL: process.env.AUTH_URL || "NOT SET",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
  VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
  isProduction,
  hasAuthSecret: !!authSecret,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("No account found with this email");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH] authorize error:", error.message);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    // Keep sessions reasonably short to reduce risk on shared devices.
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  secret: authSecret,
});