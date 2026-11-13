import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton, ErrorState } from "@/components/common/States";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { evidenceApi } from "@/services/evidence";
import { useSkills } from "@/hooks/useSkills";
import { EVIDENCE_KINDS, type EvidenceKind } from "@/types";
import { errorMessage, titleCase } from "@/lib/utils";
import { SkillPicker } from "./SkillPicker";

/** Proof of ability: projects, GitHub, portfolio, certificates and work samples. */
export function EvidenceList() {
  const qc = useQueryClient();
  const { nameOf } = useSkills();
  const q = useQuery({ queryKey: ["evidence"], queryFn: evidenceApi.mine });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("PROJECT");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["evidence"] });
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["matches"] });
  };
  const create = useMutation({
    mutationFn: () => evidenceApi.create({ title, kind, url: url || undefined, description, skills }),
    onSuccess: () => {
      toast.success("Evidence added", { description: "Your evidence score and matches were updated." });
      setTitle("");
      setUrl("");
      setDescription("");
      setSkills([]);
      setAdding(false);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({ mutationFn: evidenceApi.remove, onSuccess: refresh, onError: (e) => toast.error(errorMessage(e)) });

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Proof of ability</CardTitle>
          <CardDescription>Projects, GitHub, portfolios and work samples. Organisations you work with can endorse them.</CardDescription>
        </div>
        {!adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden /> Add evidence
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {adding && (
          <form
            className="grid gap-3 rounded-lg border bg-muted/40 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-title">Title</Label>
                <Input id="ev-title" required minLength={2} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hostel mess-menu web app" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-kind">Kind</Label>
                <Select id="ev-kind" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
                  {EVIDENCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {titleCase(k)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-url">Link (optional)</Label>
              <Input id="ev-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/you/project" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-desc">What did you do?</Label>
              <Textarea id="ev-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Skills shown</Label>
              <SkillPicker exclude={skills} onPick={(s) => setSkills([...skills, s])} placeholder="Tag skills this proves" />
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <button key={s} type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="cursor-pointer" aria-label={`Remove ${nameOf(s)}`}>
                    <Badge variant="secondary">
                      {nameOf(s)} <X className="size-3" aria-hidden />
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={create.isPending || !skills.length || title.trim().length < 2}>
                {create.isPending ? "Adding…" : "Add"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
        {q.isLoading ? (
          <ListSkeleton rows={2} className="h-20" />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data?.length ? (
          !adding && <p className="text-sm text-muted-foreground">No evidence yet. One project link already raises your Evidence score.</p>
        ) : (
          <ul className="grid gap-3">
            {q.data.map((e) => (
              <li key={e._id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {e.title}
                      <Badge variant="muted">{titleCase(e.kind)}</Badge>
                      {e.endorsedBy && typeof e.endorsedBy !== "string" && (
                        <Badge variant="success">
                          <BadgeCheck className="size-3.5" aria-hidden /> Endorsed by {e.endorsedBy.name}
                        </Badge>
                      )}
                    </p>
                    {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                        {e.url.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.skills.map((s) => (
                        <SkillChip key={s} name={nameOf(s)} />
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove.mutate(e._id)} aria-label={`Delete ${e.title}`}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
