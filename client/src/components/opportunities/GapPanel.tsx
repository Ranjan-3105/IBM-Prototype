import { Link } from "react-router-dom";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSkills } from "@/hooks/useSkills";
import type { GapResponse } from "@/types";
import { SkillChip } from "./SkillChip";
import { MatchBadge } from "./MatchBadge";
import { prettyBlocker } from "@/lib/opportunity";

/** Have ✅ / missing ❌ / learn next / alternatives you already qualify for. */
export function GapPanel({ data }: { data: GapResponse }) {
  const { nameOf } = useSkills();
  const { result, analysis, alternatives } = data;
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="pt-5">
          <p className="leading-relaxed">{analysis.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">{analysis.source === "AI" ? "Written by Gemini from the computed facts" : "Template summary (AI unavailable)"}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-success" aria-hidden /> What you already have
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.matchedSkills.length ? result.matchedSkills.map((s) => <SkillChip key={s} name={nameOf(s)} tone="have" />) : <p className="text-sm text-muted-foreground">None of the listed skills yet — that's OK, start below.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="size-5 text-destructive" aria-hidden /> What's missing
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex flex-wrap gap-1.5">
              {result.missingSkills.length ? (
                result.missingSkills.map((s) => <SkillChip key={s.skill} name={nameOf(s.skill)} tone="missing" note={`${s.have}→${s.needed}${s.mandatory ? " · required" : ""}`} />)
              ) : (
                <p className="text-sm text-muted-foreground">No skill gaps.</p>
              )}
            </div>
            {result.blockers.length > 0 && (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.blockers.map((b) => (
                  <li key={b}>{prettyBlocker(b, nameOf)}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis.learnNext.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Lightbulb className="size-5 text-warning" aria-hidden /> Learn next
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {analysis.learnNext.map((l) => (
              <Card key={l.skill} className="p-4">
                <p className="font-medium">{l.skill}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l.why}</p>
                <p className="mt-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                  <span className="font-medium">First step: </span>
                  {l.firstStep}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold">Roles you already qualify for</h2>
        {alternatives.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((a) => (
              <Link key={a.opportunityId} to={`/opportunities/${a.opportunityId}`} className="rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{a.title}</p>
                  <MatchBadge score={a.score} />
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="muted">{a.isRemote ? "Remote" : "On-site"}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Add a few more skills to your profile to unlock alternatives.</p>
        )}
      </div>
    </div>
  );
}
