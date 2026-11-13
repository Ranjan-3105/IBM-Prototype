import { useQuery } from "@tanstack/react-query";
import { matchesApi } from "@/services/matches";

export const useMatches = (limit = 10) => useQuery({ queryKey: ["matches", limit], queryFn: () => matchesApi.mine(limit) });
