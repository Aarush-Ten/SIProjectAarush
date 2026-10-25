import { z } from "zod";
import type { MatchRequest } from "@/lib/types/api";

export const profileSchema = z.object({
  education_level: z.enum(["school", "iti", "diploma", "undergraduate", "other"]),
  study_field: z.string().trim().min(1, "Enter your study area.").max(100, "Keep your study area within 100 characters."),
  skills: z.array(z.object({ skill_id: z.string().min(1), self_reported_level: z.number().int().min(0).max(3) })).max(40).refine((skills) => new Set(skills.map((skill) => skill.skill_id)).size === skills.length, "Choose each skill only once."),
  interests: z.array(z.string().min(1)).max(12).refine((interests) => new Set(interests).size === interests.length, "Choose each interest only once."),
  hours_per_week: z.number({ error: "Enter weekly study hours." }).int("Use a whole number of hours.").min(1, "Choose at least 1 hour per week.").max(30, "Choose no more than 30 hours per week."),
  budget_inr: z.number({ error: "Enter your learning budget." }).min(0, "Your budget cannot be negative.").max(1000000, "Use a budget up to ₹10,00,000."),
  device_access: z.enum(["smartphone_only", "laptop", "shared_computer"]),
  language: z.enum(["en", "mr"]),
  goal: z.enum(["internship", "first_job", "career_exploration", "upskilling"]),
  consent: z.boolean().refine(Boolean, "Please acknowledge how this demo handles your profile."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const demoProfile: ProfileFormValues = {
  education_level: "diploma",
  study_field: "Computer engineering",
  skills: [
    { skill_id: "python", self_reported_level: 2 },
    { skill_id: "html", self_reported_level: 2 },
    { skill_id: "sql", self_reported_level: 1 },
  ],
  interests: ["cybersecurity"],
  hours_per_week: 6,
  budget_inr: 0,
  device_access: "laptop",
  language: "en",
  goal: "career_exploration",
  consent: false,
};

export function toMatchRequest(values: ProfileFormValues): MatchRequest {
  const { skills, interests, consent: _consent, ...profile } = profileSchema.parse(values);
  return { profile, skills, interests };
}
