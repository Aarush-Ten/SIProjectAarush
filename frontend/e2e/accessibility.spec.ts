import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fixture from "../tests/fixtures/phase2-session.json" with { type: "json" };

test("WCAG 2.2 AA scans across the guest journey at mobile and desktop widths", async ({ page }) => {
  test.setTimeout(120_000);
  const findings: unknown[] = [];
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/onboarding", "/dashboard", "/careers/soc-analyst", "/roadmap", "/about"]) {
      await page.addInitScript((data) => localStorage.setItem("pathforge.session.v2", JSON.stringify(data)), fixture);
      await page.goto(route);
      await expect(page.getByRole("contentinfo")).toBeVisible();
      if (route === "/onboarding") await expect(page.getByLabel("Python skill level", { exact: true })).toBeVisible();
      if (route.includes("/careers/")) await expect(page.getByTestId("career-comparison")).toBeVisible();
      if (route === "/roadmap") await expect(page.getByTestId("roadmap-weeks")).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      if (result.violations.length) findings.push({ route, width, violations: result.violations.map((issue) => ({ id: issue.id, impact: issue.impact, nodes: issue.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })) });
    }
  }
  await test.info().attach("accessibility-findings", { body: JSON.stringify(findings, null, 2), contentType: "application/json" });
  expect(findings).toEqual([]);
});
