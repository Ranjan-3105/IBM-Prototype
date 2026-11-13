import { Link } from "react-router-dom";
import { Gauge, ScanSearch, Sparkles, Timer } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { ScoreBreakdown } from "@/components/opportunities/ScoreBreakdown";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMatches } from "@/hooks/useMatches";
import { useSkills } from "@/hooks/useSkills";
import { prettyBlocker } from "@/lib/opportunity";

export default function Matches() {
  const q = useMatches(10);
  const { nameOf } = useSkills();

  return (
    <Page>
      <PageHeader title="Your matches" description="Ranked by a deterministic score. The AI only explains it." />

      {q.data && (
        <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 p-4 text-sm" aria-live="polite">
          <span className="flex items-center gap-2">
            <Timer className="size-4 text-primary" aria-hidden />
            <strong className="tabular-nums">{q.data.evaluated}</strong> opportunities evaluated in <strong className="tabular-nums">{q.data.ms} ms</strong>
          </span>
          <span className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" aria-hidden />
            <strong className="tabular-nums">{q.data.eligibleCount}</strong> eligible matches vs <strong className="tabular-nums">{q.data.keywordBaseline}</strong> with a keyword-only filter
          </span>
          <span className="text-xs text-muted-foreground">Prototype measurements on seed data</span>
        </Card>
      )}

      {q.isLoading ? (
        <ListSkeleton rows={3} className="h-64" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.matches.length ? (
        <EmptyState
          title="No eligible matches yet"
          description="Try adding skills, increasing your weekly hours or travel distance."
          action={
            <Link to="/seeker/profile" className={buttonVariants({ size: "sm" })}>
              Update profile
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5">
          {q.data.matches.map((m) => (
            <OpportunityCard
              key={m.opportunityId}
              opp={m.opportunity}
              distanceKm={m.distanceKm}
              aside={<MatchBadge score={m.score} size="lg" />}
              footer={
                <div className="grid w-full gap-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_18rem]">
                    <div className="rounded-lg bg-accent/60 p-3 text-sm leading-relaxed">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                        <Sparkles className="size-3.5" aria-hidden /> Why this fits {m.explanationSource === "TEMPLATE" && <span className="font-normal opacity-70">(template)</span>}
                      </p>
                      {m.explanation}
                    </div>
                    <ScoreBreakdown breakdown={m.breakdown} />
                  </div>
                  {m.missingSkills.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      To improve: {m.missingSkills.map((s) => `${nameOf(s.skill)} (${s.have}→${s.needed})`).join(", ")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <ApplyButton opportunityId={m.opportunityId} />
                    <Link to={`/seeker/gap/${m.opportunityId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <ScanSearch aria-hidden /> See gap
                    </Link>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {q.data && q.data.nearMisses.length > 0 && (
        <section className="mt-10" aria-labelledby="near-misses">
          <h2 id="near-misses" className="text-lg font-semibold">
            Almost there
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">You match most of the skills, but something is blocking you. Open the Gap Analyzer to see what to do next.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {q.data.nearMisses.map((m) => (
              <Link key={m.opportunityId} to={`/seeker/gap/${m.opportunityId}`} className="rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{m.opportunity.title}</p>
                  <MatchBadge score={m.score} />
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {m.blockers.map((b) => (
                    <li key={b}>{prettyBlocker(b, nameOf)}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
