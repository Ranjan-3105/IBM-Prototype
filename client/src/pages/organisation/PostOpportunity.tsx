import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, PageHeader, PageLoader } from "@/components/common/States";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SkillPicker } from "@/components/profile/SkillPicker";
import { opportunitiesApi } from "@/services/opportunities";
import { useSkills } from "@/hooks/useSkills";
import { useMe } from "@/hooks/useMe";
import { ACCESS_LABELS, ACCESS_TAGS, AREAS, COMP_KINDS, OPP_TYPES, type Opportunity } from "@/types";
import { errorMessage, titleCase } from "@/lib/utils";

const Schema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(120),
    description: z.string().trim().min(10, "Describe the work in a sentence or two").max(5000),
    type: z.enum(OPP_TYPES),
    requiredSkills: z.array(z.object({ skill: z.string(), minLevel: z.number().int().min(1).max(5), mandatory: z.boolean() })).min(1, "Add at least one skill"),
    isRemote: z.boolean(),
    area: z.string(),
    hoursPerWeek: z.number({ error: "Enter hours" }).min(1, "At least 1 hour").max(60),
    compKind: z.enum(COMP_KINDS),
    amount: z.number().min(0).optional(),
    accessibilityProvided: z.array(z.enum(ACCESS_TAGS)),
    deadline: z.string().optional(),
  })
  .refine((d) => d.isRemote || !!d.area, { message: "Choose where the work happens", path: ["area"] });
type Form = z.infer<typeof Schema>;

const fromOpp = (o: Opportunity): Form => ({
  title: o.title,
  description: o.description,
  type: o.type,
  requiredSkills: o.requiredSkills,
  isRemote: o.isRemote,
  area: o.isRemote ? "" : o.area ?? "",
  hoursPerWeek: o.hoursPerWeek,
  compKind: o.compensation.kind,
  amount: o.compensation.amount,
  accessibilityProvided: o.accessibilityProvided ?? [],
  deadline: o.deadline ? o.deadline.slice(0, 10) : "",
});

export default function PostOpportunity() {
  const { id } = useParams();
  const existing = useQuery({ queryKey: ["opportunity", id], queryFn: () => opportunitiesApi.get(id!), enabled: !!id });
  if (id && existing.isLoading) return <PageLoader />;
  if (id && (existing.isError || !existing.data))
    return (
      <Page>
        <ErrorState error={existing.error} />
      </Page>
    );
  return <OpportunityForm existing={existing.data} />;
}

function OpportunityForm({ existing }: { existing?: Opportunity }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const { nameOf } = useSkills();
  const { register, control, handleSubmit, setValue, reset, formState } = useForm<Form>({
    resolver: zodResolver(Schema),
    defaultValues: existing
      ? fromOpp(existing)
      : { type: "VOLUNTEER", requiredSkills: [], isRemote: false, area: "", hoursPerWeek: 6, compKind: "UNPAID", accessibilityProvided: [] },
  });
  const skills = useFieldArray({ control, name: "requiredSkills" });
  const isRemote = useWatch({ control, name: "isRemote" });
  const compKind = useWatch({ control, name: "compKind" });
  const access = useWatch({ control, name: "accessibilityProvided" }) ?? [];

  // Default the location to the organisation's own area.
  useEffect(() => {
    if (!existing && me.data?.area && AREAS[me.data.area]) reset((v) => ({ ...v, area: v.area || me.data!.area! }));
  }, [me.data, existing, reset]);

  const save = useMutation({
    mutationFn: (v: Form) => {
      const body = {
        title: v.title,
        description: v.description,
        type: v.type,
        requiredSkills: v.requiredSkills,
        isRemote: v.isRemote,
        ...(v.area && AREAS[v.area] ? { area: v.area, location: { coordinates: AREAS[v.area]! } } : {}),
        hoursPerWeek: v.hoursPerWeek,
        compensation: { kind: v.compKind, ...(v.compKind !== "UNPAID" && v.amount ? { amount: v.amount } : {}) },
        accessibilityProvided: v.accessibilityProvided,
        ...(v.deadline ? { deadline: v.deadline } : {}),
      };
      return existing ? opportunitiesApi.update(existing._id, body) : opportunitiesApi.create(body);
    },
    onSuccess: (o) => {
      toast.success(existing ? "Opportunity updated" : "Opportunity published", { description: "Matching seekers can see it now." });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["opportunity", o._id] });
      navigate("/org");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Page className="max-w-3xl">
      <PageHeader title={existing ? "Edit opportunity" : "Post an opportunity"} description="Describe what you need. Skills are matched by level, not keywords." />
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="grid gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>The work</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" aria-invalid={!!formState.errors.title} placeholder="e.g. Build our NGO website" {...register("title")} />
              <FieldError message={formState.errors.title?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} aria-invalid={!!formState.errors.description} placeholder="What will the person do? What will they learn?" {...register("description")} />
              <FieldError message={formState.errors.description?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" {...register("type")}>
                  {OPP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {titleCase(t)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input id="deadline" type="date" {...register("deadline")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills needed</CardTitle>
            <CardDescription>Set a minimum level. Mark a skill “required” only if it's truly essential — missing it blocks the match.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SkillPicker exclude={skills.fields.map((f) => f.skill)} onPick={(slug) => skills.append({ skill: slug, minLevel: 2, mandatory: false })} />
            <FieldError message={formState.errors.requiredSkills?.message ?? formState.errors.requiredSkills?.root?.message} />
            <ul className="grid gap-2">
              {skills.fields.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_9rem_7rem_auto]">
                  <span className="font-medium">{nameOf(f.skill)}</span>
                  <Controller
                    control={control}
                    name={`requiredSkills.${i}.minLevel`}
                    render={({ field }) => (
                      <Select aria-label={`Minimum level for ${nameOf(f.skill)}`} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="h-9">
                        {[1, 2, 3, 4, 5].map((l) => (
                          <option key={l} value={l}>
                            Min level {l}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <Controller control={control} name={`requiredSkills.${i}.mandatory`} render={({ field }) => <Checkbox label="Required" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} />
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => skills.remove(i)} aria-label={`Remove ${nameOf(f.skill)}`}>
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where, when and pay</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center sm:col-span-2">
              <Controller control={control} name="isRemote" render={({ field }) => <Checkbox label="This work can be done fully remotely" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="area">{isRemote ? "Organisation area (optional)" : "Where the work happens"}</Label>
              <Select id="area" aria-invalid={!!formState.errors.area} {...register("area")}>
                <option value="">{isRemote ? "—" : "Choose an area…"}</option>
                {Object.keys(AREAS).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
              <FieldError message={formState.errors.area?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="hours">Hours per week</Label>
              <Input id="hours" type="number" min={1} max={60} aria-invalid={!!formState.errors.hoursPerWeek} {...register("hoursPerWeek", { valueAsNumber: true })} />
              <FieldError message={formState.errors.hoursPerWeek?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="compKind">Compensation</Label>
              <Select id="compKind" {...register("compKind")}>
                <option value="UNPAID">Voluntary / unpaid</option>
                <option value="STIPEND">Stipend</option>
                <option value="PAID">Paid</option>
              </Select>
            </div>
            {compKind !== "UNPAID" && (
              <div className="grid gap-1.5">
                <Label htmlFor="amount">Amount (₹ per month, optional)</Label>
                <Input id="amount" type="number" min={0} {...register("amount", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility provided</CardTitle>
            <CardDescription>People who need these will only see on-site roles that provide them.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {ACCESS_TAGS.map((t) => (
              <Checkbox
                key={t}
                label={ACCESS_LABELS[t]}
                checked={access.includes(t)}
                onChange={() => setValue("accessibilityProvided", access.includes(t) ? access.filter((x) => x !== t) : [...access, t])}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending ? "Saving…" : existing ? "Save changes" : "Publish opportunity"}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </Page>
  );
}
