import { afterEach, expect, it, vi } from "vitest";
import { getSkillCatalog } from "@/lib/api/client";
afterEach(() => vi.unstubAllGlobals());
it("explains a free-host HTML 503 cold start rather than treating it as profile validation", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Starting</html>", { status: 503 })));
  await expect(getSkillCatalog()).rejects.toMatchObject({ status: 503, message: expect.stringContaining("Wait a minute") });
});
