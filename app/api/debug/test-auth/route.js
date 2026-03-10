import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Step 1: Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ step: "findUser", error: "User not found", email });
    }

    // Step 2: Compare password
    const match = await bcrypt.compare(password, user.passwordHash);

    return NextResponse.json({
      step: "complete",
      userFound: true,
      passwordMatch: match,
      userId: user.id,
      role: user.role,
      hashPrefix: user.passwordHash?.substring(0, 7),
    });
  } catch (error) {
    return NextResponse.json(
      { step: "error", message: error.message, name: error.name },
      { status: 500 }
    );
  }
}
