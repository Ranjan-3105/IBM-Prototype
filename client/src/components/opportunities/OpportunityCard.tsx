import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useSkills } from "@/hooks/useSkills";
import type { Opportunity } from "@/types";
import { OpportunityMeta, TypeBadge } from "./OpportunityMeta";
import { orgName } from "@/lib/opportunity";
import { SkillChip } from "./SkillChip";

export function OpportunityCard({ opp, aside, footer, distanceKm }: { opp: Opportunity; aside?: ReactNode; footer?: ReactNode; distanceKm?: number | null }) {
  const { nameOf } = useSkills();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={opp.type} />
            {opp.status === "CLOSED" && <span className="text-xs font-medium text-destructive">Closed</span>}
          </div>
          <h3 className="text-lg font-semibold leading-snug">
            <Link to={`/opportunities/${opp._id}`} className="hover:text-primary hover:underline underline-offset-4">
              {opp.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{orgName(opp)}</p>
        </div>
        {aside}
      </div>
      <OpportunityMeta opp={opp} distanceKm={distanceKm} />
      <div className="flex flex-wrap gap-1.5">
        {opp.requiredSkills.map((r) => (
          <SkillChip key={r.skill} name={nameOf(r.skill)} level={r.minLevel} note={r.mandatory ? "required" : undefined} />
        ))}
      </div>
      {footer && <div className="mt-1 flex flex-wrap items-center gap-2 border-t pt-3">{footer}</div>}
    </Card>
  );
}
