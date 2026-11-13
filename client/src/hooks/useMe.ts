import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/users";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: usersApi.me });
