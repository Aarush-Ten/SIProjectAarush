import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { apiBase } from "@/lib/api-origin";

export const expertInputSchema = z.object({
  name: z.string().trim().min(2).max(100), bio: z.string().trim().max(2000),
  expertise: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  contact: z.string().trim().max(250).nullable(), availability: z.string().trim().max(300),
  verified: z.boolean(), approved: z.boolean(), active: z.boolean(),
  public_visible: z.boolean(), public_contact: z.boolean(), is_demo: z.boolean(),
});
export const expertSchema = expertInputSchema.extend({ id: z.string() });
export type ExpertInput = z.infer<typeof expertInputSchema>;
export type Expert = z.infer<typeof expertSchema>;
export const publicExpertSchema = z.object({
  id: z.string(), name: z.string(), bio: z.string(), expertise: z.array(z.string()),
  contact: z.string().nullable(), availability: z.string(), is_demo: z.boolean(),
  consultation_available: z.boolean(),
});
export const getPublicExperts = () => apiRequest("/experts", z.array(publicExpertSchema));
export const getAdminExperts = (token: string) => apiRequest("/admin/experts", z.array(expertSchema), { headers: { Authorization: `Bearer ${token}` } });
export const saveExpert = (token: string, value: ExpertInput, id?: string) => apiRequest(`/admin/experts${id ? `/${encodeURIComponent(id)}` : ""}`, expertSchema, {
  method: id ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(value),
});
// The shared client expects JSON; DELETE intentionally returns an empty 204 response.
export async function deleteExpert(token: string, id: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${apiBase}/api/v1/admin/experts/${encodeURIComponent(id)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: "no-store", credentials: "omit", redirect: "error",
    });
    if (!response.ok) throw new Error("Could not remove this expert. Check your credentials and try again.");
  } finally { clearTimeout(timeout); }
}
