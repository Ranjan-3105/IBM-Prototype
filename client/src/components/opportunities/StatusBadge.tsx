import { Badge } from "@/components/ui/badge";
import type { AppStatus } from "@/types";
import { titleCase } from "@/lib/utils";

const TONE: Record<AppStatus, "muted" | "secondary" | "success" | "destructive" | "default"> = {
  APPLIED: "muted",
  SHORTLISTED: "secondary",
  ACCEPTED: "success",
  REJECTED: "destructive",
  COMPLETED: "default",
};

export function StatusBadge({ status }: { status: AppStatus }) {
  return <Badge variant={TONE[status]}>{titleCase(status)}</Badge>;
}
