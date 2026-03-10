import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      take: 10,
    });
    return NextResponse.json({
      status: "connected",
      userCount,
      users,
      env: {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || "NOT SET",
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: (process.env.DATABASE_URL || "").substring(0, 30) + "...",
        nodeEnv: process.env.NODE_ENV,
        authSecretLength: (process.env.AUTH_SECRET || "").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error.message, stack: error.stack?.split("\n").slice(0, 5) },
      { status: 500 }
    );
  }
}
