import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthOptions } from "next-auth";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prismaAdapter } from "@/lib/auth/prisma-adapter";
import crypto from "crypto";

export const auth = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Enforce single-device session: sessionId must match user's activeSessionId.
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, activeSessionId: true },
  });

  const sessionId = (session.user as any).sessionId as string | undefined;
  if (!dbUser?.isActive || !dbUser.activeSessionId || !sessionId || dbUser.activeSessionId !== sessionId) {
    redirect("/sign-in");
  }

  return {
    userId: session.user.id,
    user: session.user,
  };
};

export const authOptions: AuthOptions = {
  adapter: prismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await db.user.findUnique({
          where: {
            phoneNumber: credentials.phoneNumber,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Remove maxAge to make sessions persist indefinitely
    updateAge: 0, // Disable session updates
  },
  jwt: {
    // Remove maxAge to make JWT tokens persist indefinitely
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.phoneNumber = token.phoneNumber;
        session.user.image = token.picture ?? undefined;
        session.user.role = token.role;
        (session.user as any).sessionId = (token as any).sessionId;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const sessionId = crypto.randomUUID();
        // Mark user active and bind token to this sessionId
        await db.user.update({
          where: { id: user.id as string },
          data: { isActive: true, activeSessionId: sessionId },
        });
        // When user first signs in, set the token with user data
        return {
          ...token,
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          picture: (user as any).picture,
          role: user.role,
          sessionId,
        };
      }

      // On subsequent requests, return the existing token
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 