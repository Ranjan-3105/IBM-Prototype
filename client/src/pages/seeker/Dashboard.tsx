import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, Gauge, Sparkles, Target } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { OpportunityMeta } from "@/components/opportunities/OpportunityMeta";
import { orgName } from "@/lib/opportunity";
import { StatusBadge } from "@/components/opportunities/StatusBadge";
import { useMyApplications } from "@/hooks/useApplications";
import { useMe } from "@/hooks/useMe";
import { useMatches } from "@/hooks/useMatches";

export default function SeekerDashboard() {
  const me = useMe();
  const matches = useMatches(5);
  const apps = useMyApplications();
  const stats = me.data?.stats;

  const tips: string[] = [];
  if (me.data) {
    if (me.data.skills.length < 4) tips.push("Add at least 4 skills — or paste a description in “Extract from text”.");
    if (!stats?.evidenceCount) tips.push("Add a project, GitHub link or portfolio as proof of ability.");
    if (!me.data.preferences?.types?.length) tips.push("Pick the kinds of opportunities you want.");
    if (!me.data.headline) tips.push("Write a one-line headline about yourself.");
  }

  return (
    <Page>
      <PageHeader
        title={me.data ? `Hi, ${me.data.name.split(" ")[0]}` : "Dashboard"}
        description="Your best matches, profile strength and applications."
        actions={
          <Link to="/seeker/assistant" className={buttonVariants()}>
            <Sparkles aria-hidden /> Your Next Opportunity
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {me.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Profile strength" value={`${stats?.profileStrength ?? 0}%`} icon={<Gauge />} hint={<Progress value={stats?.profileStrength ?? 0} label="Profile strength" />} />
            <StatCard label="Evidence score" value={`${stats?.evidenceScore ?? 0}%`} icon={<BadgeCheck />} hint="Skills backed by proof or endorsements" />
            <StatCard label="Eligible matches" value={matches.data?.eligibleCount ?? "–"} icon={<Target />} hint={matches.data ? `${matches.data.evaluated} opportunities evaluated in ${matches.data.ms} ms` : " "} />
            <StatCard label="Applications" value={apps.data?.length ?? "–"} icon={<Briefcase />} hint={`${apps.data?.filter((a) => a.status === "SHORTLISTED" || a.status === "ACCEPTED").length ?? 0} shortlisted or accepted`} />
          </>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="top-matches">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="top-matches" className="text-lg font-semibold">
              Top matches
            </h2>
            <Link to="/seeker/matches" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          {matches.isLoading ? (
            <ListSkeleton rows={3} className="h-24" />
          ) : matches.isError ? (
            <ErrorState error={matches.error} onRetry={() => matches.refetch()} />
          ) : !matches.data?.matches.length ? (
            <EmptyState title="No eligible matches yet" description="Add skills and set your availability to unlock matches." action={<Link to="/seeker/profile" className={buttonVariants({ size: "sm" })}>Complete your profile</Link>} />
          ) : (
            <ul className="grid gap-3">
              {matches.data.matches.map((m) => (
                <li key={m.opportunityId}>
                  <Link to={`/opportunities/${m.opportunityId}`} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.opportunity.title}</p>
                      <p className="mb-2 text-sm text-muted-foreground">{orgName(m.opportunity)}</p>
                      <OpportunityMeta opp={m.opportunity} distanceKm={m.distanceKm} />
                    </div>
                    <MatchBadge score={m.score} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid content-start gap-6">
          {tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strengthen your profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link to="/seeker/profile" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}>
                  Edit Skill DNA
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application status</CardTitle>
            </CardHeader>
            <CardContent>
              {apps.isLoading ? (
                <ListSkeleton rows={2} className="h-10" />
              ) : apps.isError ? (
                <ErrorState error={apps.error} />
              ) : !apps.data?.length ? (
                <p className="text-sm text-muted-foreground">You haven't applied yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {apps.data.slice(0, 5).map((a) => (
                    <li key={a._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{a.opportunity?.title ?? "Removed opportunity"}</span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
