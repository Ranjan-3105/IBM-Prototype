import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/services/applications";

export function useMyApplications(enabled = true) {
  return useQuery({ queryKey: ["applications"], queryFn: applicationsApi.mine, enabled });
}
