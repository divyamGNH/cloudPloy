import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("access-token");

    const pagesThatDontNeedAuth = ["/login", "/signup", "/home"];

    const notNeedsAuth = pagesThatDontNeedAuth.some((page) =>
        req.nextUrl.pathname.startsWith(page)
    );

    if (!token && !notNeedsAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token && notNeedsAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/signup",
        "/home",
        "/",
    ],
};
