import { Link } from "react-router-dom";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/opportunities/StatusBadge";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { useMyApplications } from "@/hooks/useApplications";
import { cn, formatDate, titleCase } from "@/lib/utils";
import { APP_STATUS } from "@/types";

export default function Applications() {
  const q = useMyApplications();
  return (
    <Page>
      <PageHeader title="My applications" description="Track every application and how it is progressing." />
      {q.isLoading ? (
        <ListSkeleton rows={3} className="h-32" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="No applications yet" description="Find a match and apply in one click." action={<Link to="/seeker/matches" className={buttonVariants({ size: "sm" })}>See my matches</Link>} />
      ) : (
        <div className="grid gap-4">
          {q.data.map((a) => {
            const org = a.opportunity && typeof a.opportunity.organisation !== "string" ? a.opportunity.organisation?.name : "";
            const reached = new Set(a.history.map((h) => h.status));
            const path = a.status === "REJECTED" ? (["APPLIED", ...a.history.filter((h) => h.status !== "APPLIED").map((h) => h.status)] as typeof APP_STATUS[number][]) : (["APPLIED", "SHORTLISTED", "ACCEPTED", "COMPLETED"] as const);
            return (
              <Card key={a._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {a.opportunity ? (
                      <Link to={`/opportunities/${a.opportunity._id}`} className="text-lg font-semibold hover:text-primary hover:underline underline-offset-4">
                        {a.opportunity.title}
                      </Link>
                    ) : (
                      <p className="text-lg font-semibold">Removed opportunity</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {org} · {a.opportunity ? titleCase(a.opportunity.type) : ""} · applied {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MatchBadge score={a.matchScore} />
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs" aria-label="Status timeline">
                  {path.map((s, i) => {
                    const h = a.history.find((x) => x.status === s);
                    const done = reached.has(s);
                    return (
                      <li key={s} className="flex items-center gap-2">
                        {i > 0 && <span className={cn("h-px w-6 sm:w-10", done ? "bg-primary" : "bg-border")} aria-hidden />}
                        <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1", done ? (s === "REJECTED" ? "border-destructive/40 text-destructive" : "border-primary/40 bg-accent text-accent-foreground") : "text-muted-foreground")}>
                          {titleCase(s)}
                          {h && <span className="opacity-70">{formatDate(h.at)}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
