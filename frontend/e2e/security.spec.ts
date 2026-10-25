import { test, expect } from "@playwright/test";

test("CSP uses fresh server nonces and blocks injected scripts and handlers", async ({ page, request }) => {
  const first = await request.get("/", { headers: { "x-nonce": "attacker", "Content-Security-Policy": "script-src 'unsafe-inline'" } });
  const second = await request.get("/");
  const policy = first.headers()["content-security-policy"];
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).not.toContain("attacker");
  expect(policy.split(";").find(value => value.trim().startsWith("script-src"))).not.toContain("unsafe-inline");
  expect(second.headers()["content-security-policy"]).not.toBe(policy);
  expect(first.headers()["cache-control"]).toContain("no-store");
  expect(first.headers()["x-frame-options"]).toBe("DENY");
  const response = await page.goto("/");
  const nonce = response!.headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
  expect(await page.locator("script:not([src])").evaluateAll((scripts, expected) => scripts.filter(script => script.textContent?.trim()).every(script => (script as HTMLScriptElement).nonce === expected), nonce)).toBe(true);
  // DevTools evaluation can bypass CSP. Deliver untrusted HTML to the actual
  // document parser, retaining the CSP from a real server response instead.
  await page.addInitScript(() => {
    const state = window as typeof window & { securityExecuted?: boolean; blockedScripts?: number };
    state.securityExecuted = false; state.blockedScripts = 0;
    document.addEventListener("securitypolicyviolation", event => { if (event.violatedDirective.startsWith("script-src")) state.blockedScripts!++; });
  });
  await page.route("**/?security-probe=1", async route => {
    const original = await route.fetch();
    await route.fulfill({ status: 200, contentType: "text/html", headers: { "Content-Security-Policy": original.headers()["content-security-policy"] }, body: '<!doctype html><html><body><script>window.securityExecuted=true</script><button id="security-probe" onclick="window.securityExecuted=true">Security test probe</button></body></html>' });
  });
  await page.goto("/?security-probe=1");
  await page.locator("#security-probe").click();
  expect(await page.evaluate(() => (window as typeof window & { securityExecuted?: boolean }).securityExecuted)).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { blockedScripts?: number }).blockedScripts)).toBeGreaterThanOrEqual(1);
  await page.unroute("**/?security-probe=1");
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Find my pathway" }).click();
  await expect(page.getByLabel("Study area", { exact: true })).toBeVisible();
});

test("stored expert markup is rendered as text, and public contact never becomes an executable link", async ({ page, request }) => {
  const headers = { Authorization: "Bearer test-only-administrator-token-123456789" };
  const name = '<img src=x onerror="window.securityExecuted=true">';
  const response = await request.post("http://localhost:8000/api/v1/admin/experts", { headers, data: {
    name, bio: "<script>window.securityExecuted=true</script>", expertise: ["Security test profile"],
    contact: "javascript:alert(1)", public_contact: true, verified: true, approved: true, public_visible: true, availability: "Test only",
  } });
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  try {
    await page.goto("/experts");
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    expect(await page.locator("main img, main script, main a[href^='javascript:']").count()).toBe(0);
    expect(await page.evaluate(() => (window as typeof window & { securityExecuted?: boolean }).securityExecuted)).not.toBe(true);
    await expect(page.getByText("Contact: javascript:alert(1)", { exact: true })).toBeVisible();
  } finally {
    expect((await request.delete(`http://localhost:8000/api/v1/admin/experts/${id}`, { headers })).status()).toBe(204);
  }
});
