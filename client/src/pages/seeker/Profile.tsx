import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Sparkles, Wand2 } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, PageHeader, PageLoader } from "@/components/common/States";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { SkillEditor } from "@/components/profile/SkillEditor";
import { EvidenceList } from "@/components/profile/EvidenceList";
import { SkillChip } from "@/components/opportunities/SkillChip";
import { useMe } from "@/hooks/useMe";
import { usersApi } from "@/services/users";
import { ACCESS_LABELS, ACCESS_TAGS, AREAS, OPP_TYPES, type AccessTag, type ExtractResponse, type OppType, type User, type UserSkill } from "@/types";
import { errorMessage, titleCase } from "@/lib/utils";

export default function Profile() {
  const me = useMe();
  if (me.isLoading) return <PageLoader />;
  if (me.isError || !me.data)
    return (
      <Page>
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </Page>
    );
  return <ProfileForm user={me.data} />;
}

function ProfileForm({ user }: { user: User }) {
  const qc = useQueryClient();
  const [headline, setHeadline] = useState(user.headline ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [skills, setSkills] = useState<UserSkill[]>(user.skills);
  const [hours, setHours] = useState(user.availability?.hoursPerWeek ?? 10);
  const [remoteOnly, setRemoteOnly] = useState(user.availability?.remoteOnly ?? false);
  const [maxKm, setMaxKm] = useState(user.availability?.maxTravelKm ?? 15);
  const [area, setArea] = useState(user.area ?? "");
  const [access, setAccess] = useState<AccessTag[]>(user.accessibilityNeeds ?? []);
  const [types, setTypes] = useState<OppType[]>(user.preferences?.types ?? []);
  const [paidOnly, setPaidOnly] = useState(user.preferences?.paidOnly ?? false);
  const [extractOpen, setExtractOpen] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      usersApi.update({
        headline,
        bio,
        skills: skills.map((s) => ({ skill: s.skill, level: s.level, ...(s.source === "AI_EXTRACTED" ? { source: "AI_EXTRACTED" as const } : {}) })),
        availability: { hoursPerWeek: hours, remoteOnly, maxTravelKm: maxKm },
        accessibilityNeeds: access,
        preferences: { types, paidOnly },
        ...(area && AREAS[area] ? { area, location: { coordinates: AREAS[area] } } : {}),
      }),
    onSuccess: (u) => {
      qc.setQueryData(["me"], u);
      qc.invalidateQueries({ queryKey: ["matches"] });
      setSkills(u.skills);
      toast.success("Profile saved", { description: "Your matches have been recalculated." });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const live = useMe();
  const stats = live.data?.stats ?? user.stats;

  return (
    <Page>
      <PageHeader
        title="Your Skill DNA"
        description="What you can actually do, when you're available, where you are and what you need."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save aria-hidden /> {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>About you</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" value={headline} maxLength={140} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. 2nd-year CSE student · React & Java" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} maxLength={2000} onChange={(e) => setBio(e.target.value)} placeholder="What have you built, taught, organised or made?" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Skills</CardTitle>
                <CardDescription>1 = heard of it · 3 = can build small things alone · 5 = expert</CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setExtractOpen(true)}>
                <Wand2 aria-hidden /> Extract from text
              </Button>
            </CardHeader>
            <CardContent>
              <SkillEditor value={skills} onChange={setSkills} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability & location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="hours">
                  Hours per week: <span className="tabular-nums">{hours}</span>
                </Label>
                <Slider id="hours" min={0} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="km">
                  Max travel: <span className="tabular-nums">{maxKm} km</span>
                </Label>
                <Slider id="km" min={1} max={30} value={maxKm} disabled={remoteOnly} onChange={(e) => setMaxKm(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="area">Where are you based?</Label>
                <Select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Bhubaneswar (city centre)</option>
                  {Object.keys(AREAS).map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Checkbox label="I can only work remotely" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility needs</CardTitle>
                <CardDescription>On-site roles that don't provide these are filtered out. Remote roles stay.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {ACCESS_TAGS.map((t) => (
                  <Checkbox key={t} label={ACCESS_LABELS[t]} checked={access.includes(t)} onChange={() => setAccess(toggle(access, t))} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>What you're looking for</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {OPP_TYPES.map((t) => (
                  <Checkbox key={t} label={titleCase(t)} checked={types.includes(t)} onChange={() => setTypes(toggle(types, t))} />
                ))}
                <hr className="my-2" />
                <Checkbox label="Paid work only" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} />
              </CardContent>
            </Card>
          </div>

          <EvidenceList />
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Profile strength</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{stats?.profileStrength ?? 0}%</p>
            <Progress value={stats?.profileStrength ?? 0} className="mt-3" label="Profile strength" />
            <p className="mt-4 text-sm text-muted-foreground">Evidence score</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{stats?.evidenceScore ?? 0}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Share of your skills backed by a project, link or endorsement. It feeds the “E” part of every match.</p>
          </Card>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
            <Save aria-hidden /> {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </aside>
      </div>

      <ExtractDialog
        open={extractOpen}
        onClose={() => setExtractOpen(false)}
        initialText={bio}
        onApply={(found, extra) => {
          const merged = [...skills];
          for (const f of found) {
            const i = merged.findIndex((s) => s.skill === f.skill);
            if (i === -1) merged.push({ skill: f.skill, level: f.level, source: "AI_EXTRACTED" });
            else if (merged[i]!.level < f.level) merged[i] = { ...merged[i]!, level: f.level };
          }
          setSkills(merged);
          if (extra.hoursPerWeek != null) setHours(Math.min(40, extra.hoursPerWeek));
          if (extra.remoteOnly != null) setRemoteOnly(extra.remoteOnly);
          if (extra.preferredTypes.length) setTypes(Array.from(new Set([...types, ...extra.preferredTypes])));
          toast.success(`Added ${found.length} skill${found.length === 1 ? "" : "s"}`, { description: "Review the levels, then save your profile." });
        }}
      />
    </Page>
  );
}

function ExtractDialog({ open, onClose, initialText, onApply }: { open: boolean; onClose: () => void; initialText: string; onApply: (skills: ExtractResponse["skills"], extra: ExtractResponse) => void }) {
  const [text, setText] = useState(initialText);
  const [picked, setPicked] = useState<string[]>([]);
  const extract = useMutation({
    mutationFn: () => usersApi.extractSkills(text),
    onSuccess: (r) => setPicked(r.skills.map((s) => s.skill)),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const r = extract.data;
  return (
    <Dialog open={open} onClose={onClose} title="Extract skills from text">
      <div className="grid gap-3">
        <Label htmlFor="extract-text">Paste a bio, project description or anything about what you can do</Label>
        <Textarea id="extract-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="I built a React app for my hostel mess, I'm learning Node and I can give 2 hours a day…" />
        <Button onClick={() => extract.mutate()} disabled={extract.isPending || text.trim().length < 10}>
          <Sparkles aria-hidden /> {extract.isPending ? "Reading…" : "Suggest skills"}
        </Button>
        {r && (
          <div className="grid gap-3 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{r.source === "AI" ? "Suggested by Gemini — you confirm before saving." : "Suggested by keyword matching (AI unavailable) — you confirm before saving."}</p>
            {r.skills.length === 0 ? (
              <p className="text-sm">No catalogue skills found. Try naming tools or technologies you've used.</p>
            ) : (
              <ul className="grid gap-2">
                {r.skills.map((s) => (
                  <li key={s.skill} className="flex items-center justify-between gap-2">
                    <Checkbox
                      checked={picked.includes(s.skill)}
                      onChange={() => setPicked((p) => (p.includes(s.skill) ? p.filter((x) => x !== s.skill) : [...p, s.skill]))}
                      label={<SkillChip name={s.name} level={s.level} source="AI_EXTRACTED" />}
                    />
                    {s.evidence && <span className="truncate text-xs text-muted-foreground">“{s.evidence}”</span>}
                  </li>
                ))}
              </ul>
            )}
            {(r.hoursPerWeek != null || r.remoteOnly != null) && (
              <p className="text-xs text-muted-foreground">
                Also detected: {r.hoursPerWeek != null && `${r.hoursPerWeek} h/week`} {r.remoteOnly ? "· prefers remote" : ""}
              </p>
            )}
            <Button
              variant="secondary"
              disabled={!picked.length}
              onClick={() => {
                onApply(r.skills.filter((s) => picked.includes(s.skill)), r);
                onClose();
              }}
            >
              Add {picked.length} to my skills
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
