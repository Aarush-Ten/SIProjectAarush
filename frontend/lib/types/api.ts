import type { components } from "./generated-api";
import type { z } from "zod";
import type { roadmapSchema, selectedMatchSchema } from "@/lib/api/schemas";

type Schemas = components["schemas"];
export type StudentProfile = Schemas["ProfileSnapshot"];
export type EducationLevel = StudentProfile["education_level"];
export type Goal = StudentProfile["goal"];
export type DeviceAccess = StudentProfile["device_access"];
export type Language = StudentProfile["language"];
export type MatchRequest = Schemas["MatchRequest"];
export type ProfileSkill = Schemas["ProfileSkillInput"];
export type Skill = Schemas["SkillOutput"];
export type Interest = Schemas["InterestOutput"];
export type SkillCatalog = Schemas["SkillCatalog"];
export type Career = Schemas["CareerOutput"];
export type CareerSkill = Schemas["CareerSkillOutput"];
export type SkillGap = Schemas["GapOutput"];
export type CareerMatch = Schemas["CareerMatch"];
export type FeasibilityComponent = Schemas["FeasibilityComponent"];
// Runtime validation requires the formula before display. The API serializes
// the default formula; OpenAPI describes fields with defaults as optional.
export type MatchesResponse = Omit<Schemas["MatchResponse"], "formula"> & { formula: Schemas["MatchFormula"] };
export type ApiErrorBody = Schemas["ErrorResponse"];
export type RoadmapRequest = Schemas["RoadmapRequest"];
export type LearningResource = Schemas["LearningResourceOutput"];
export type Roadmap = Schemas["RoadmapResponse"] & z.infer<typeof roadmapSchema>;
export type RoadmapTask = Roadmap["weeks"][number]["tasks"][number];
export type SelectedCareerMatch = Schemas["CareerMatchResponse"] & z.infer<typeof selectedMatchSchema>;
