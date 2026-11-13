import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "@/services/skills";

/** Skill catalogue + a slug → display-name helper. Cached for the session. */
export function useSkills() {
  const query = useQuery({ queryKey: ["skills"], queryFn: skillsApi.all, staleTime: Infinity });
  const nameOf = useMemo(() => {
    const map = new Map((query.data ?? []).map((s) => [s.slug, s.name]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [query.data]);
  return { skills: query.data ?? [], nameOf, isLoading: query.isLoading };
}
