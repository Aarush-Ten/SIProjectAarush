import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { validatedApiBase } from "@/lib/api-origin";
import { apiRequest } from "@/lib/api/client";
import { deleteExpert } from "@/lib/api/experts";

afterEach(() => vi.unstubAllGlobals());
it.each(["http://public.example", "javascript:alert(1)", "https://user:password@api.example", "https://api.example?key=secret", "https://api.example/#fragment", "https://api.example/path"])("rejects unsafe API base %s", value => {
  expect(() => validatedApiBase(value)).toThrow();
});
it("accepts explicit HTTPS and local development origins", () => {
  expect(validatedApiBase("https://api.example/")).toBe("https://api.example");
  expect(validatedApiBase("http://localhost:8000")).toBe("http://localhost:8000");
});
it("API clients omit ambient credentials and refuse redirects for authenticated requests", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify("ok"))).mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  await apiRequest("/admin/experts", z.string(), { headers: { Authorization: "Bearer test-only-token" } });
  await deleteExpert("test-only-token", "expert-id");
  for (const [, options] of fetch.mock.calls) {
    expect(options.credentials).toBe("omit");
    expect(options.redirect).toBe("error");
  }
});
