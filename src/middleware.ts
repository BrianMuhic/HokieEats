import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/request-meal", "/fulfill-orders", "/my-orders", "/pay", "/dev", "/fulfiller-earnings", "/admin"];
const authPaths = ["/sign-in", "/sign-up", "/verify-otp"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  const isHome = pathname === "/";

  const sessionCookie = req.cookies.get("vt-eating-session");
  const hasSession = !!sessionCookie?.value;

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAuth && hasSession && pathname !== "/verify-otp") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isHome && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/request-meal/:path*", "/fulfill-orders/:path*", "/my-orders/:path*", "/pay/:path*", "/dev/:path*", "/fulfiller-earnings/:path*", "/admin/:path*", "/sign-in", "/sign-up", "/verify-otp"],
};
