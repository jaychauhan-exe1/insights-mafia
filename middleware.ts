import { type NextRequest, NextResponse } from "next/server";
import { decrypt, updateSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Skip public assets and APIs
  const isPublicAsset =
    path.startsWith("/_next") || path.startsWith("/api") || path.includes(".");
  if (isPublicAsset) return NextResponse.next();

  const isLoginPage = path === "/login";
  const isRootPage = path === "/";

  // 2. Get session and try to refresh it
  const sessionCookie = request.cookies.get("session")?.value;
  let session = null;

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie);
    } catch (e) {
      console.error("Middleware Decrypt Error:", e);
    }
  }

  // 3. Auth Logic
  if (!session && !isLoginPage) {
    console.log(`No session found for ${path}, redirecting to /login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (isLoginPage || isRootPage)) {
    console.log(`Session found for ${path}, redirecting to /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Role-based protection
  if (session && path.startsWith("/dashboard")) {
    const role = session.user.role;

    if (path.includes("/admin") && role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (path.includes("/employee") && role !== "Employee") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (path.includes("/freelancer") && role !== "Freelancer") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 5. Refresh session if a valid session exists
  // This extends the cookie expiration on every request (sliding session)
  if (session) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
