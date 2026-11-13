import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Globe, ScanSearch } from "lucide-react";
import { BackButton } from "@/components/common/BackButton";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, PageLoader } from "@/components/common/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OpportunityMeta, TypeBadge } from "@/components/opportunities/OpportunityMeta";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { opportunitiesApi } from "@/services/opportunities";
import { useAuth } from "@/hooks/useAuth";
import { useSkills } from "@/hooks/useSkills";
import { formatDate, titleCase } from "@/lib/utils";

export default function OpportunityDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { nameOf } = useSkills();
  const q = useQuery({ queryKey: ["opportunity", id], queryFn: () => opportunitiesApi.get(id) });

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !q.data)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Page>
    );
  const opp = q.data;
  const org = typeof opp.organisation === "string" ? null : opp.organisation;
  const isOwner = user?.role === "ORGANISATION" && org?._id === user.id;

  return (
    <Page>
      <BackButton fallback="/opportunities" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={opp.type} />
              {opp.status === "CLOSED" && <span className="text-sm font-medium text-destructive">Closed</span>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{opp.title}</h1>
            <p className="mt-1 text-muted-foreground">{org?.name}</p>
            <div className="mt-4">
              <OpportunityMeta opp={opp} />
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-relaxed">{opp.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills needed</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {opp.requiredSkills.map((r) => (
                <SkillChip key={r.skill} name={nameOf(r.skill)} level={r.minLevel} note={r.mandatory ? "required" : "nice to have"} />
              ))}
            </CardContent>
          </Card>
        </div>
        <aside className="grid content-start gap-4">
          <Card className="p-5">
            {user?.role === "SEEKER" && opp.status === "OPEN" && (
              <div className="grid gap-2">
                <ApplyButton opportunityId={opp._id} size="default" />
                <Link to={`/seeker/gap/${opp._id}`} className={buttonVariants({ variant: "outline" })}>
                  <ScanSearch aria-hidden /> How do I fit?
                </Link>
              </div>
            )}
            {!user && (
              <Link to="/register" className={buttonVariants({ className: "w-full" })}>
                Sign up to apply
              </Link>
            )}
            {isOwner && (
              <div className="grid gap-2">
                <Link to={`/org/opportunities/${opp._id}/applicants`} className={buttonVariants()}>
                  View applicants
                </Link>
                <Link to={`/org/opportunities/${opp._id}/edit`} className={buttonVariants({ variant: "outline" })}>
                  Edit
                </Link>
              </div>
            )}
            <dl className="mt-4 grid gap-3 text-sm">
              {opp.deadline && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Deadline</dt>
                  <dd>Apply by {formatDate(opp.deadline)}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Posted by</dt>
                <dd className="font-medium">{org?.name}</dd>
                {org?.orgType && <dd className="text-muted-foreground">{titleCase(org.orgType)}{org.area ? ` · ${org.area}` : ""}</dd>}
              </div>
              {org?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" aria-hidden />
                  <a href={org.website} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                    Website
                  </a>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
