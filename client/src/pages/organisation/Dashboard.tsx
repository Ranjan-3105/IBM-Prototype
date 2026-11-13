import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Inbox, Plus, Users } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { StatCard } from "@/components/dashboard/StatCard";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { opportunitiesApi } from "@/services/opportunities";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/utils";

export default function OrgDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["opportunities", "mine"], queryFn: opportunitiesApi.mine });
  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "CLOSED" }) => opportunitiesApi.update(id, { status }),
    onSuccess: (o) => {
      toast.success(o.status === "OPEN" ? "Reopened" : "Closed");
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const opps = q.data ?? [];
  const open = opps.filter((o) => o.status === "OPEN").length;
  const applicants = opps.reduce((n, o) => n + (o.applicantCount ?? 0), 0);
  const pending = opps.reduce((n, o) => n + (o.pendingCount ?? 0), 0);

  return (
    <Page>
      <PageHeader
        title={user?.name ?? "Organisation"}
        description="Your opportunities and the people who applied."
        actions={
          <Link to="/org/new" className={buttonVariants()}>
            <Plus aria-hidden /> Post opportunity
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open opportunities" value={q.isLoading ? "–" : open} icon={<Briefcase />} />
        <StatCard label="Total applicants" value={q.isLoading ? "–" : applicants} icon={<Users />} />
        <StatCard label="Awaiting review" value={q.isLoading ? "–" : pending} icon={<Inbox />} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">My opportunities</h2>
      {q.isLoading ? (
        <ListSkeleton rows={3} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !opps.length ? (
        <EmptyState title="You haven't posted anything yet" description="Describe what you need — skills, hours, pay and accessibility — and we'll rank the people who fit." action={<Link to="/org/new" className={buttonVariants({ size: "sm" })}>Post your first opportunity</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {opps.map((o) => (
            <OpportunityCard
              key={o._id}
              opp={o}
              aside={
                <Badge variant={o.pendingCount ? "warning" : "muted"}>
                  {o.applicantCount ?? 0} applicant{o.applicantCount === 1 ? "" : "s"}
                </Badge>
              }
              footer={
                <>
                  <Link to={`/org/opportunities/${o._id}/applicants`} className={buttonVariants({ size: "sm" })}>
                    <Users aria-hidden /> Applicants
                  </Link>
                  <Link to={`/org/opportunities/${o._id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    Edit
                  </Link>
                  <Button size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: o._id, status: o.status === "OPEN" ? "CLOSED" : "OPEN" })}>
                    {o.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
    </Page>
  );
}
