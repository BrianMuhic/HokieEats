import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validateVtEmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalized = email.toLowerCase().trim();

    if (!validateVtEmail(normalized)) {
      return NextResponse.json(
        { error: "You must use a @vt.edu email address." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        emailVerified: false,
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.otpCode.create({
      data: {
        email: normalized,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail(normalized, code);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sign up error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
