import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyApplications } from "@/hooks/useApplications";
import { toast } from "sonner";
import { Check, Send } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { applicationsApi } from "@/services/applications";
import { errorMessage } from "@/lib/utils";

export function ApplyButton({ opportunityId, size = "sm" }: { opportunityId: string; size?: ButtonProps["size"] }) {
  const qc = useQueryClient();
  const apps = useMyApplications();
  const applied = apps.data?.some((a) => (typeof a.opportunity === "string" ? a.opportunity : a.opportunity?._id) === opportunityId);
  const m = useMutation({
    mutationFn: () => applicationsApi.apply(opportunityId),
    onSuccess: () => {
      toast.success("Application sent", { description: "The organisation sees your match breakdown." });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (applied)
    return (
      <Button size={size} variant="secondary" disabled>
        <Check aria-hidden /> Applied
      </Button>
    );
  return (
    <Button size={size} onClick={() => m.mutate()} disabled={m.isPending || apps.isLoading}>
      <Send aria-hidden /> {m.isPending ? "Applying…" : "Apply"}
    </Button>
  );
}
