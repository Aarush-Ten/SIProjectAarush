import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/lib/api-origin";

export function proxy(request: NextRequest) {
  // Generate locally: never trust an inbound nonce or CSP header.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'", // existing React progress-bar widths; scripts remain nonce-only
    "img-src 'self' data:", "font-src 'self'", "object-src 'none'",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
    `connect-src 'self' ${apiBase}${dev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  if (request.nextUrl.protocol === "https:") response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
