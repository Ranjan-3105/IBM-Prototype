import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Footprints, Save, ScanSearch, Sparkles, Timer } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { EmptyState, PageHeader } from "@/components/common/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { MatchBadge } from "@/components/opportunities/MatchBadge";
import { ScoreBreakdown } from "@/components/opportunities/ScoreBreakdown";
import { OpportunityMeta } from "@/components/opportunities/OpportunityMeta";
import { orgName } from "@/lib/opportunity";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { matchesApi } from "@/services/matches";
import { usersApi } from "@/services/users";
import { useMe } from "@/hooks/useMe";
import { errorMessage, titleCase } from "@/lib/utils";

const SAMPLE =
  "I'm a 2nd-year engineering student, I know Java, React and basic SQL, I can work 2 hours a day, I prefer remote work and I have no experience.";

export default function Assistant() {
  const qc = useQueryClient();
  const me = useMe();
  const [text, setText] = useState("");
  const [useSaved, setUseSaved] = useState(false);
  const run = useMutation({ mutationFn: () => matchesApi.nextOpportunity(text, useSaved), onError: (e) => toast.error(errorMessage(e)) });

  const saveToProfile = useMutation({
    mutationFn: async () => {
      const r = run.data!;
      const current = me.data?.skills ?? [];
      const merged = new Map(current.map((s) => [s.skill, { skill: s.skill, level: s.level, ...(s.source === "AI_EXTRACTED" ? { source: "AI_EXTRACTED" as const } : {}) }]));
      for (const s of r.profile.extracted) {
        const prev = merged.get(s.skill);
        if (!prev) merged.set(s.skill, { skill: s.skill, level: s.level, source: "AI_EXTRACTED" as const });
        else if (prev.level < s.level) merged.set(s.skill, { ...prev, level: s.level });
      }
      return usersApi.update({
        skills: [...merged.values()],
        availability: {
          hoursPerWeek: r.profile.hoursPerWeek,
          remoteOnly: r.profile.remoteOnly,
          maxTravelKm: me.data?.availability?.maxTravelKm ?? 15,
        },
        preferences: { types: r.profile.preferredTypes, paidOnly: me.data?.preferences?.paidOnly ?? false },
      });
    },
    onSuccess: (u) => {
      qc.setQueryData(["me"], u);
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Saved to your profile", { description: "Skills were added as AI-extracted — adjust levels any time." });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const r = run.data;

  return (
    <Page>
      <PageHeader title="Your Next Opportunity" description="Tell us about yourself in one or two sentences. We'll build your skill profile, find your top 3 matches and suggest one next step." />

      <Card>
        <CardContent className="grid gap-3 pt-5">
          <Label htmlFor="about" className="sr-only">
            About you
          </Label>
          <Textarea
            id="about"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I'm a final-year B.Com student, good at Canva and Instagram, I can give 6 hours a week, only remote."
            className="text-base"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="link" className="h-auto p-0" onClick={() => setText(SAMPLE)}>
                Use the sample sentence
              </Button>
              <Checkbox label="Also use my saved profile (location, accessibility, existing skills)" checked={useSaved} onChange={(e) => setUseSaved(e.target.checked)} />
            </div>
            <Button size="lg" onClick={() => run.mutate()} disabled={run.isPending || text.trim().length < 15}>
              <Sparkles aria-hidden /> {run.isPending ? "Finding…" : "Find my next opportunity"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div aria-live="polite" className="mt-8">
        {run.isPending && (
          <div className="grid gap-4">
            <Skeleton className="h-24" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        )}

        {r && !run.isPending && (
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">1 · Your skill profile</CardTitle>
                  <p className="text-xs text-muted-foreground">{r.profile.source === "AI" ? "Extracted by Gemini" : "Extracted by keyword matching (AI unavailable)"}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => saveToProfile.mutate()} disabled={saveToProfile.isPending || saveToProfile.isSuccess || !r.profile.extracted.length}>
                  <Save aria-hidden /> {saveToProfile.isSuccess ? "Saved" : "Save to my profile"}
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.profile.skills.length ? (
                    r.profile.skills.map((s) => <SkillChip key={s.skill} name={s.name} level={s.level} source={s.source} />)
                  ) : (
                    <span className="text-sm text-muted-foreground">No skills recognised — try naming tools or technologies.</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">{r.profile.hoursPerWeek} h/week</Badge>
                  <Badge variant="outline">{r.profile.remoteOnly ? "Remote only" : "Remote or on-site"}</Badge>
                  {r.profile.preferredTypes.map((t) => (
                    <Badge key={t} variant="outline">
                      {titleCase(t)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section aria-labelledby="top3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="top3" className="font-semibold">
                  2 · Your top {r.top3.length || 3} matches
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="size-3.5" aria-hidden /> {r.evaluated} opportunities evaluated in {r.ms} ms
                </p>
              </div>
              {r.top3.length === 0 ? (
                <EmptyState title="No eligible matches yet" description="The next step below shows what would unlock them." />
              ) : (
                <ol className="grid gap-4 md:grid-cols-3">
                  {r.top3.map((m, i) => (
                    <li key={m.opportunityId}>
                      <Card className="flex h-full flex-col gap-3 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                          <MatchBadge score={m.score} />
                        </div>
                        <div>
                          <Link to={`/opportunities/${m.opportunityId}`} className="font-semibold leading-snug hover:text-primary hover:underline underline-offset-4">
                            {m.opportunity.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">{orgName(m.opportunity)}</p>
                        </div>
                        <OpportunityMeta opp={m.opportunity} distanceKm={m.distanceKm} />
                        <p className="flex-1 rounded-lg bg-accent/60 p-3 text-sm">{m.explanation}</p>
                        <ScoreBreakdown breakdown={m.breakdown} compact />
                        <div className="flex gap-2">
                          <ApplyButton opportunityId={m.opportunityId} />
                          <Link to={`/seeker/gap/${m.opportunityId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            <ScanSearch aria-hidden /> Gap
                          </Link>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <Card className="border-primary/40 bg-accent/50">
              <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Footprints className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold">3 · Your next step{r.nextStep.name ? `: ${r.nextStep.name}` : ""}</h2>
                  <p className="mt-1">{r.nextStep.text}</p>
                  {r.nextStep.unlocks.length > 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Helps with: {r.nextStep.unlocks.join(" · ")}
                    </p>
                  )}
                  <Link to="/seeker/matches" className={buttonVariants({ variant: "link", className: "mt-1 h-auto p-0" })}>
                    See all my matches <ArrowRight aria-hidden />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}
