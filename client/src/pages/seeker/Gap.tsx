import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { BackButton } from "@/components/common/BackButton";
import { GapPanel } from "@/components/opportunities/GapPanel";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { ScoreBreakdown } from "@/components/opportunities/ScoreBreakdown";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { matchesApi } from "@/services/matches";

export default function Gap() {
  const { id = "" } = useParams();
  const q = useQuery({ queryKey: ["gap", id], queryFn: () => matchesApi.gap(id) });

  return (
    <Page>
      <BackButton fallback="/seeker/matches" />
      {q.isLoading ? (
        <ListSkeleton rows={3} className="h-40" />
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <PageHeader
            title="Opportunity Gap Analyzer"
            description={
              <>
                For{" "}
                <Link to={`/opportunities/${q.data.opportunity._id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {q.data.opportunity.title}
                </Link>
              </>
            }
            actions={q.data.result.eligible ? <ApplyButton opportunityId={q.data.opportunity._id} size="default" /> : undefined}
          />
          <Card className="mb-6 grid gap-4 p-5 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex items-center gap-3">
              <MatchBadge score={q.data.result.score} size="lg" />
              {q.data.result.eligible ? <Badge variant="success">Eligible</Badge> : <Badge variant="warning">Not yet eligible</Badge>}
            </div>
            <ScoreBreakdown breakdown={q.data.result.breakdown} compact />
          </Card>
          <GapPanel data={q.data} />
        </>
      )}
    </Page>
  );
}
