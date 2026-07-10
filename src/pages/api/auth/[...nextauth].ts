import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { getDb, COLLECTIONS } from "@/lib/mongodb";

/**
 * OAuth is optional: providers are only registered when their credentials
 * are present, so the app still boots (localStorage-only) with no env vars.
 */

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions: NextAuthOptions = {
  providers,
  // NextAuth refuses to run in production without a secret. When OAuth is
  // fully disabled (no providers) no sessions can ever be issued, so a static
  // fallback keeps the app booting in localStorage-only mode. With providers
  // configured, a real NEXTAUTH_SECRET must be set.
  secret:
    process.env.NEXTAUTH_SECRET ||
    (providers.length === 0 ? "localstorage-only-mode-no-oauth" : undefined),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      // Register/refresh the account record so the admin dashboard sees
      // every user, even before they sync any progress.
      try {
        const db = await getDb();
        if (db && user.email) {
          const email = user.email.toLowerCase();
          const existing = await db
            .collection(COLLECTIONS.users)
            .findOne({ email });
          if (existing?.status === "deactivated") {
            return false; // blocked by an admin
          }
          await db.collection(COLLECTIONS.users).updateOne(
            { email },
            {
              $set: {
                name: user.name || existing?.name || email,
                image: user.image || null,
                lastLoginAt: new Date(),
              },
              $setOnInsert: {
                email,
                role: getAdminEmails().includes(email) ? "admin" : "member",
                status: "active",
                source: "oauth",
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );
          await db
            .collection(COLLECTIONS.events)
            .insertOne({ email, type: "login", at: new Date() });
        }
      } catch {
        // DB down should never block sign-in; progress falls back to localStorage
      }
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        token.isAdmin = getAdminEmails().includes(
          String(token.email).toLowerCase()
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {},
};

export default NextAuth(authOptions);
