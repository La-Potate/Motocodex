import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 throws a URIError while decoding dynamic route segments that contain
 * a malformed percent-sequence (e.g. "/news/%e0%a4%a"), which surfaces as a 500
 * from every dynamic route. A page-level try/catch cannot intercept it because
 * the throw happens before the segment reaches the page, so reject it here.
 */
export function proxy(req: NextRequest) {
  try {
    decodeURIComponent(req.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
