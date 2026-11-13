import { Accessibility, Clock, IndianRupee, MapPin, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ACCESS_LABELS, type Opportunity } from "@/types";
import { inr, titleCase } from "@/lib/utils";

export function TypeBadge({ type }: { type: Opportunity["type"] }) {
  return <Badge variant="secondary">{titleCase(type)}</Badge>;
}

export function PayLabel({ c }: { c: Opportunity["compensation"] }) {
  if (c.kind === "UNPAID") return <>Voluntary</>;
  return (
    <>
      {c.kind === "STIPEND" ? "Stipend" : "Paid"}
      {c.amount ? ` · ${inr(c.amount)}/mo` : ""}
    </>
  );
}

export function OpportunityMeta({ opp, distanceKm }: { opp: Opportunity; distanceKm?: number | null }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      <li className="flex items-center gap-1.5">
        {opp.isRemote ? <Wifi className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
        {opp.isRemote ? "Remote" : opp.area ?? "Bhubaneswar"}
        {distanceKm != null && !opp.isRemote && <span>· {distanceKm} km</span>}
      </li>
      <li className="flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden />
        {opp.hoursPerWeek} h/week
      </li>
      <li className="flex items-center gap-1.5">
        <IndianRupee className="size-4" aria-hidden />
        <PayLabel c={opp.compensation} />
      </li>
      {opp.accessibilityProvided?.length > 0 && (
        <li className="flex items-center gap-1.5" title={opp.accessibilityProvided.map((a) => ACCESS_LABELS[a]).join(", ")}>
          <Accessibility className="size-4" aria-hidden />
          {opp.accessibilityProvided.map((a) => ACCESS_LABELS[a]).join(" · ")}
        </li>
      )}
    </ul>
  );
}
