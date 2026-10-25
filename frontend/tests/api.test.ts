import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiRequest, getMatches, getSkillCatalog } from "@/lib/api/client";
import { demoProfile, toMatchRequest } from "@/lib/profile-schema";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("typed API transport", () => {
  it("validates catalog responses and makes anonymous requests", async () => {
    const data = { skills: [{ id: "python", label_en: "Python", label_mr: null, description: "Programming foundations" }], interests: [{ id: "cybersecurity", label: "Cybersecurity" }] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getSkillCatalog()).toEqual(data);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/catalog/skills");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store", headers: { Accept: "application/json" } });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  });
  it("rejects a malformed successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ skills: "not a catalog" }))));
    await expect(getSkillCatalog()).rejects.toThrow("expected format");
  });
  it("shows a consistent backend error without requiring error details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "validation_error", message: "Unknown skill selected." } }), { status: 422 })));
    await expect(getSkillCatalog()).rejects.toMatchObject({ message: "Unknown skill selected.", status: 422 });
  });
  it("handles unreadable server replies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream failed", { status: 502 })));
    await expect(getSkillCatalog()).rejects.toThrow("unreadable response");
  });
  it("turns network errors into a useful retry message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(getSkillCatalog()).rejects.toThrow("Check that the backend is running");
  });
  it("cancels an in-flight request when its bounded timeout expires", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      signal = options.signal as AbortSignal;
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));
    const promise = apiRequest("/health", z.object({ status: z.string() }), {}, 50);
    const assertion = expect(promise).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(51);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("honors the caller’s cancellation signal", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => { options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }); })));
    const promise = getSkillCatalog(controller.signal);
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(ApiError);
  });
  it("preserves exact backend scores and serializes only the profile snapshot", async () => {
    const career = { slug: "test-career", title: "Test career", summary: "Curated demo", interest_tags: ["cybersecurity"], device_requirement: "computer", recommended_hours_per_week: 6, practice_budget_inr: 0, device_note: "Computer needed", source_note: "curated_demo", tasks: [], skills: [] };
    const match = { career, coverage: 33.33, interest_match: 50, interest_status: "matched", feasibility: { score: 100, components: [], warnings: [] }, fit_score: 47.5, missing_skills: [], reasons: ["Transparent rule"] };
    const body = { matches: [match, { ...match, career: { ...career, slug: "second" } }, { ...match, career: { ...career, slug: "third" } }], total_careers_evaluated: 12, formula: { coverage_weight: .6, interest_weight: .25, feasibility_weight: .15 }, notice: "Advisory only" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal("fetch", fetchMock);
    const request = toMatchRequest({ ...demoProfile, consent: true });
    const response = await getMatches(request);
    expect(response.matches[0].coverage).toBe(33.33);
    expect(response.matches[0].fit_score).toBe(47.5);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(request);
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });
});
