import { apiRequest } from "./client";
import type { Plan } from "./types";

export function listPlansForApplication(accessToken: string | null, applicationKey: string) {
  return apiRequest<Plan[]>(`/applications/${applicationKey}/plans`, { accessToken });
}
