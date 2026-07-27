import { api } from "@/services/api";

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}
