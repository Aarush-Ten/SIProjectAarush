export function validatedApiBase(value: string): string {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!["http:", "https:"].includes(url.protocol) || (url.protocol === "http:" && !loopback) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Configure NEXT_PUBLIC_API_URL as an HTTPS origin (HTTP is allowed only for loopback development).");
  }
  return url.origin;
}

export const apiBase = validatedApiBase(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
