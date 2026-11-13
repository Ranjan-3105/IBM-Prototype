import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Star } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/common/States";
import { BackButton } from "@/components/common/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { ScoreBreakdown } from "@/components/opportunities/ScoreBreakdown";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { StatusBadge } from "@/components/opportunities/StatusBadge";
import { opportunitiesApi } from "@/services/opportunities";
import { applicationsApi } from "@/services/applications";
import { evidenceApi } from "@/services/evidence";
import { reviewsApi } from "@/services/reviews";
import { useSkills } from "@/hooks/useSkills";
import { prettyBlocker } from "@/lib/opportunity";
import { ACCESS_LABELS, type Applicant, type AppStatus } from "@/types";
import { cn, errorMessage, titleCase } from "@/lib/utils";

const NEXT: Record<AppStatus, Exclude<AppStatus, "APPLIED">[]> = {
  APPLIED: ["SHORTLISTED", "ACCEPTED", "REJECTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["COMPLETED", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
};

export default function Applicants() {
  const { id = "" } = useParams();
  const opp = useQuery({ queryKey: ["opportunity", id], queryFn: () => opportunitiesApi.get(id) });
  const q = useQuery({ queryKey: ["applicants", id], queryFn: () => opportunitiesApi.applicants(id) });
  const [reviewing, setReviewing] = useState<Applicant | null>(null);

  return (
    <Page>
      <BackButton fallback="/org" />
      <PageHeader title="Applicants" description={opp.data ? <>Ranked by live match score for <span className="font-medium text-foreground">{opp.data.title}</span></> : "Ranked by live match score"} />
      {q.isLoading ? (
        <ListSkeleton rows={3} className="h-48" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="No applicants yet" description="Matching seekers will see this opportunity in their ranked matches." />
      ) : (
        <ol className="grid gap-4">
          {q.data.map((a, i) => (
            <ApplicantCard key={a._id} a={a} rank={i + 1} opportunityId={id} onReview={() => setReviewing(a)} />
          ))}
        </ol>
      )}
      {reviewing && <ReviewDialog a={reviewing} opportunityId={id} requiredSkills={opp.data?.requiredSkills.map((r) => r.skill) ?? []} onClose={() => setReviewing(null)} />}
    </Page>
  );
}

function ApplicantCard({ a, rank, opportunityId, onReview }: { a: Applicant; rank: number; opportunityId: string; onReview: () => void }) {
  const qc = useQueryClient();
  const { nameOf } = useSkills();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["applicants", opportunityId] });
    qc.invalidateQueries({ queryKey: ["opportunities", "mine"] });
  };
  const status = useMutation({
    mutationFn: (s: Exclude<AppStatus, "APPLIED">) => applicationsApi.setStatus(a._id, s),
    onSuccess: (r) => {
      toast.success(`${a.applicant?.name ?? "Applicant"} ${titleCase(r.status).toLowerCase()}`);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const endorse = useMutation({
    mutationFn: evidenceApi.endorse,
    onSuccess: () => {
      toast.success("Evidence endorsed", { description: "Those skills now show as verified on their profile." });
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const u = a.applicant;
  const canEndorse = a.status === "ACCEPTED" || a.status === "COMPLETED";
  const matched = new Set(a.match?.matchedSkills ?? []);

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-2 w-5 text-sm font-medium text-muted-foreground">#{rank}</span>
            <Avatar name={u?.name ?? "?"} />
            <div>
              <p className="font-semibold">{u?.name ?? "Deleted user"}</p>
              <p className="text-sm text-muted-foreground">{u?.headline}</p>
              <p className="text-xs text-muted-foreground">
                {u?.area ?? "Bhubaneswar"} · {u?.availability?.hoursPerWeek ?? 0} h/week
                {a.match?.distanceKm != null && ` · ${a.match.distanceKm} km away`}
                {u?.accessibilityNeeds?.length ? ` · needs ${u.accessibilityNeeds.map((n) => ACCESS_LABELS[n].toLowerCase()).join(", ")}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MatchBadge score={a.match?.score ?? a.matchScore} size="lg" />
            <StatusBadge status={a.status} />
          </div>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_18rem]">
          <div className="grid content-start gap-3">
            {a.message && <p className="rounded-lg bg-muted p-3 text-sm italic">“{a.message}”</p>}
            <div className="flex flex-wrap gap-1.5">
              {(u?.skills ?? []).map((s) => (
                <span key={s.skill} className={cn(!matched.has(s.skill) && "opacity-60")}>
                  <SkillChip name={nameOf(s.skill)} level={s.level} source={s.source} tone={matched.has(s.skill) ? "have" : "default"} />
                </span>
              ))}
            </div>
            {a.match && a.match.blockers.length > 0 && (
              <p className="text-sm text-[oklch(0.5_0.12_60)]">Note: {a.match.blockers.map((b) => prettyBlocker(b, nameOf)).join("; ")}</p>
            )}
            {a.evidence.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Proof of ability</p>
                <ul className="grid gap-2">
                  {a.evidence.map((e) => (
                    <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="font-medium">{e.title}</span>
                        <Badge variant="muted">{titleCase(e.kind)}</Badge>
                        {e.url && (
                          <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary" aria-label={`Open ${e.title}`}>
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        )}
                      </span>
                      {e.endorsedBy ? (
                        <Badge variant="success">
                          <BadgeCheck className="size-3.5" aria-hidden /> Endorsed
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" disabled={!canEndorse || endorse.isPending} title={canEndorse ? undefined : "Accept the applicant first"} onClick={() => endorse.mutate(e._id)}>
                          <BadgeCheck aria-hidden /> Endorse
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {a.match && <ScoreBreakdown breakdown={a.match.breakdown} />}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {NEXT[a.status].map((s) => (
            <Button key={s} size="sm" variant={s === "REJECTED" ? "ghost" : s === "ACCEPTED" ? "default" : "outline"} disabled={status.isPending} onClick={() => status.mutate(s)}>
              {s === "SHORTLISTED" ? "Shortlist" : s === "ACCEPTED" ? "Accept" : s === "COMPLETED" ? "Mark completed" : "Reject"}
            </Button>
          ))}
          {canEndorse &&
            (a.review ? (
              <Badge variant="secondary" className="self-center">
                <Star className="size-3.5" aria-hidden /> Reviewed {a.review.rating}/5
              </Badge>
            ) : (
              <Button size="sm" variant="secondary" onClick={onReview}>
                <Star aria-hidden /> Review & verify skills
              </Button>
            ))}
        </div>
      </Card>
    </li>
  );
}

function ReviewDialog({ a, opportunityId, requiredSkills, onClose }: { a: Applicant; opportunityId: string; requiredSkills: string[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { nameOf } = useSkills();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const candidates = Array.from(new Set([...(a.match?.matchedSkills ?? []), ...requiredSkills]));
  const [verified, setVerified] = useState<string[]>(a.match?.matchedSkills ?? []);
  const m = useMutation({
    mutationFn: () => reviewsApi.create({ applicationId: a._id, rating, comment, verifiedSkills: verified }),
    onSuccess: () => {
      toast.success("Review saved", { description: `${verified.length} skill${verified.length === 1 ? "" : "s"} verified on ${a.applicant?.name}'s profile.` });
      qc.invalidateQueries({ queryKey: ["applicants", opportunityId] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open onClose={onClose} title={`Review ${a.applicant?.name ?? "applicant"}`}>
      <div className="grid gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} className="cursor-pointer rounded p-1">
                <Star className={cn("size-6", n <= rating ? "fill-warning text-warning" : "text-muted-foreground")} aria-hidden />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-1.5">
          <Label htmlFor="comment">Comment</Label>
          <Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did they do well?" />
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Skills you saw them use (verified → endorsed)</legend>
          {candidates.map((s) => (
            <Checkbox key={s} label={nameOf(s)} checked={verified.includes(s)} onChange={() => setVerified(verified.includes(s) ? verified.filter((x) => x !== s) : [...verified, s])} />
          ))}
        </fieldset>
        <Button onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? "Saving…" : "Submit review"}
        </Button>
      </div>
    </Dialog>
  );
}
