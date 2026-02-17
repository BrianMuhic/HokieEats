import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateVtEmail } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email." },
        { status: 400 }
      );
    }

    const normalized = parsed.data.email.toLowerCase().trim();
    if (!validateVtEmail(normalized)) {
      return NextResponse.json(
        { error: "Invalid email." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return NextResponse.json(
        { error: "No account found." },
        { status: 400 }
      );
    }

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
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
