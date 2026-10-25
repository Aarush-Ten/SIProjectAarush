import { z } from "zod";
import { skillCatalogSchema, matchesSchema, careerSchema, selectedMatchSchema, roadmapSchema } from "@/lib/api/schemas";
import type { Career, MatchRequest, MatchesResponse, Roadmap, SelectedCareerMatch, SkillCatalog } from "@/lib/types/api";

import { apiBase } from "@/lib/api-origin";
export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); this.name = "ApiError"; }
}

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      ...options,
      headers: { "Accept": "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
      signal: controller.signal,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    });
    let body: unknown;
    try { body = await response.json(); } catch { throw new ApiError(response.status === 503 ? "The career service is starting or temporarily unavailable. Wait a minute, then try again." : "The server returned an unreadable response. Please try again.", response.status); }
    if (!response.ok) {
      const error = z.object({ error: z.object({ message: z.string() }) }).safeParse(body);
      throw new ApiError(error.success ? error.data.error.message : "We couldn’t complete this request. Please try again.", response.status);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError("The server response did not match the expected format. Please try again.");
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError("The request took too long or was cancelled. Please try again.");
    throw new ApiError("We couldn’t reach the career service. Check that the backend is running, then try again.");
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abort);
  }
}

export function getSkillCatalog(signal?: AbortSignal): Promise<SkillCatalog> {
  return apiRequest("/catalog/skills", skillCatalogSchema, { signal });
}

export function getMatches(request: MatchRequest, signal?: AbortSignal): Promise<MatchesResponse> {
  return apiRequest("/matches", matchesSchema, { method: "POST", body: JSON.stringify(request), signal });
}

export function getCareer(slug: string, signal?: AbortSignal): Promise<Career> {
  return apiRequest(`/catalog/careers/${encodeURIComponent(slug)}`, careerSchema, { signal });
}

export function getCareerMatch(slug: string, request: MatchRequest, signal?: AbortSignal): Promise<SelectedCareerMatch> {
  return apiRequest(`/catalog/careers/${encodeURIComponent(slug)}/match`, selectedMatchSchema, { method: "POST", body: JSON.stringify(request), signal });
}

export async function generateRoadmap(slug: string, request: MatchRequest, signal?: AbortSignal): Promise<Roadmap> {
  const roadmap = await apiRequest("/roadmaps/generate", roadmapSchema, { method: "POST", body: JSON.stringify({ career_slug: slug, ...request }), signal });
  if (roadmap.career_slug !== slug || roadmap.hours_per_week !== request.profile.hours_per_week || roadmap.estimated_cost_inr > request.profile.budget_inr) throw new ApiError("The returned learning plan does not match your profile. Please try again.");
  return roadmap;
}

