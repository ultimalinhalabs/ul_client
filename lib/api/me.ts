import { apiRequest } from "./client";
import type { Me } from "./types";

export function getMe(accessToken: string | null) {
  return apiRequest<Me>("/me", { accessToken });
}
