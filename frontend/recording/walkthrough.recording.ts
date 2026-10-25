import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("three-minute captioned local prototype walkthrough", async ({ page }) => {
  const start = Date.now();
  async function caption(text: string) {
    await page.evaluate((text) => {
      let element = document.getElementById("walkthrough-caption");
      if (!element) { element = document.createElement("div"); element.id = "walkthrough-caption"; document.body.appendChild(element); }
      element.textContent = text;
      element.style.cssText = "position:fixed;bottom:8px;left:5%;width:90%;padding:14px 20px;background:#103c32f0;color:white;font:18px/1.5 Arial;border-radius:10px;z-index:9999;pointer-events:none;text-align:center";
    }, text);
  }
  async function until(second: number) { await page.waitForTimeout(Math.max(0, second * 1000 - (Date.now() - start))); }
  await page.goto("/");
  await caption("PathForge AI by CYBERSTARS • Local working prototype • Illustrative data, no pilot outcomes claimed"); await until(18);
  await page.goto("/onboarding");
  await expect(page.getByLabel("Python skill level", { exact: true })).toBeVisible();
  await caption("Start as a guest: diploma student, Python 2, HTML 2, SQL 1, interested in cybersecurity."); await until(35);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await caption("Profile A: 6 hours/week, laptop access, zero learning budget. Constraints shape the plan."); await until(50);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await caption("The notice explains browser-local saving and the advisory limits. No contact details are required."); await until(62);
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await expect(page.getByTestId("match-soc-analyst")).toBeVisible();
  await caption("Three deterministic matches. SOC fit: 47.07/100. Self-reported coverage: 14.29%, not employment probability."); await until(82);
  await page.locator('a[href="/careers/soc-analyst"]').first().click();
  await expect(page.getByTestId("career-comparison")).toBeVisible();
  await page.getByTestId("career-comparison").scrollIntoViewIfNeeded();
  await caption("Networking and Linux begin at level 0; both require level 2. Optional gaps do not reduce essential coverage."); await until(100);
  await page.getByRole("button", { name: "Create my roadmap", exact: true }).click();
  await expect(page.getByTestId("roadmap-weeks")).toBeVisible();
  await page.getByTestId("roadmap-week-1").scrollIntoViewIfNeeded();
  await caption("The laptop plan packs 21 illustrative study hours into four weeks, never exceeding 6 hours/week. Links are checked references."); await until(122);
  await page.getByTestId("roadmap-task").first().getByRole("button", { name: "Mark done", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("completed-task-count")).toHaveText("1");
  await caption("Completion survives refresh in this browser. It records reported activity; it does not raise skill levels or prove job readiness."); await until(143);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Study hours per week", { exact: true }).fill("4");
  await page.getByRole("radio", { name: "Smartphone only", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await page.locator('a[href="/careers/soc-analyst"]').first().click();
  await page.getByRole("button", { name: "Create my roadmap", exact: true }).click();
  await expect(page.getByTestId("roadmap-weeks")).toBeVisible();
  await page.getByTestId("roadmap-week-1").scrollIntoViewIfNeeded();
  await caption("Profile B: four hours/week and phone only produces six weeks with theory alternatives. Computer practicals remain necessary."); await until(166);
  await page.goto("/about");
  await caption("Next: consenting student feedback, curriculum review, and Phase 3 assessments/AI/translations. Those features are not implemented. Thank you."); await until(180);
  const video = page.video();
  await mkdir("../docs/media", { recursive: true });
  await page.close();
  await video?.saveAs("../docs/media/pathforge-walkthrough.webm");
});
