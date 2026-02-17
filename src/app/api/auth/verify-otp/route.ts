import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, validateVtEmail } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid code." },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const normalized = email.toLowerCase().trim();

    if (!validateVtEmail(normalized)) {
      return NextResponse.json(
        { error: "Invalid email." },
        { status: 400 }
      );
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        email: normalized,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { email: normalized },
        data: { emailVerified: true },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 500 });
    }

    const token = await createSessionToken(user.id, user.email);

    const response = NextResponse.json({ success: true });
    response.cookies.set("vt-eating-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
