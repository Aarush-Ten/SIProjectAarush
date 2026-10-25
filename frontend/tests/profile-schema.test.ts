import { describe, expect, it } from "vitest";
import { demoProfile, profileSchema, toMatchRequest } from "@/lib/profile-schema";
import { formatScore } from "@/lib/utils";

const validProfile = () => ({ ...structuredClone(demoProfile), consent: true });

describe("student profile validation", () => {
  it("requires acknowledgement instead of submitting the demo automatically", () => {
    expect(profileSchema.safeParse(demoProfile).success).toBe(false);
    expect(profileSchema.safeParse(validProfile()).success).toBe(true);
  });
  it.each([0, 31, -1, 2.5, Number.NaN, Infinity])("rejects invalid weekly hours %s", (hours_per_week) => {
    expect(profileSchema.safeParse({ ...validProfile(), hours_per_week }).success).toBe(false);
  });
  it.each([1, 30])("accepts weekly hours at boundary %s", (hours_per_week) => {
    expect(profileSchema.safeParse({ ...validProfile(), hours_per_week }).success).toBe(true);
  });
  it.each([-1, 1000001, Number.NaN, Infinity])("rejects invalid INR budget %s", (budget_inr) => {
    expect(profileSchema.safeParse({ ...validProfile(), budget_inr }).success).toBe(false);
  });
  it("accepts a zero or fractional nonnegative budget", () => {
    for (const budget_inr of [0, 99.5, 1000000]) expect(profileSchema.safeParse({ ...validProfile(), budget_inr }).success).toBe(true);
  });
  it.each([-1, 4, 1.5])("rejects impossible self-reported skill level %s", (self_reported_level) => {
    expect(profileSchema.safeParse({ ...validProfile(), skills: [{ skill_id: "python", self_reported_level }] }).success).toBe(false);
  });
  it("allows no skills or interests, so new learners are not excluded", () => {
    expect(profileSchema.safeParse({ ...validProfile(), skills: [], interests: [] }).success).toBe(true);
  });
  it("rejects duplicate skills and interests", () => {
    expect(profileSchema.safeParse({ ...validProfile(), skills: [...demoProfile.skills, demoProfile.skills[0]] }).success).toBe(false);
    expect(profileSchema.safeParse({ ...validProfile(), interests: ["cybersecurity", "cybersecurity"] }).success).toBe(false);
  });
  it.each(["", "   ", "x".repeat(101)])("rejects empty and overlong study areas", (study_field) => {
    expect(profileSchema.safeParse({ ...validProfile(), study_field }).success).toBe(false);
  });
  it("rejects unsupported education, goal, device, and language values", () => {
    for (const field of ["education_level", "goal", "device_access", "language"]) expect(profileSchema.safeParse({ ...validProfile(), [field]: "unknown" }).success).toBe(false);
  });
  it("builds only the agreed stateless request and trims the study area", () => {
    const input = { ...validProfile(), study_field: "  Computer engineering  " };
    const snapshot = structuredClone(input);
    const request = toMatchRequest(input);
    expect(Object.keys(request).sort()).toEqual(["interests", "profile", "skills"]);
    expect(request.profile.study_field).toBe("Computer engineering");
    expect(request.profile).not.toHaveProperty("consent");
    expect(request.profile).not.toHaveProperty("skills");
    expect(request.skills).toEqual(demoProfile.skills);
    expect(input).toEqual(snapshot);
  });
});

describe("score presentation", () => {
  it("preserves API precision without changing scores", () => {
    expect(formatScore(65.43)).toBe("65.43");
    expect(formatScore(100)).toBe("100");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(12.5)).toBe("12.5");
  });
});
