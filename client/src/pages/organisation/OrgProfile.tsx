import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Page } from "@/layouts/AppLayout";
import { ErrorState, PageHeader, PageLoader } from "@/components/common/States";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useMe } from "@/hooks/useMe";
import { usersApi } from "@/services/users";
import { AREAS, ORG_TYPES, type OrgType, type User } from "@/types";
import { errorMessage, titleCase } from "@/lib/utils";

export default function OrgProfile() {
  const me = useMe();
  if (me.isLoading) return <PageLoader />;
  if (me.isError || !me.data)
    return (
      <Page>
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </Page>
    );
  return <Form user={me.data} />;
}

function Form({ user }: { user: User }) {
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(user.headline ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [orgType, setOrgType] = useState<OrgType>(user.orgType ?? "NGO");
  const [website, setWebsite] = useState(user.website ?? "");
  const [area, setArea] = useState(user.area ?? "");
  const save = useMutation({
    mutationFn: () => usersApi.update({ name, headline, bio, orgType, website, ...(area && AREAS[area] ? { area, location: { coordinates: AREAS[area] } } : {}) }),
    onSuccess: (u) => {
      qc.setQueryData(["me"], u);
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Page className="max-w-2xl">
      <PageHeader title="Organisation profile" description="Seekers see this on every opportunity you post. Your area is the default location for on-site roles." />
      <Card>
        <CardContent className="grid gap-4 pt-5">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="orgType">Type</Label>
              <Select id="orgType" value={orgType} onChange={(e) => setOrgType(e.target.value as OrgType)}>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "NGO" ? "NGO" : titleCase(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="area">Area</Label>
              <Select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Bhubaneswar (city centre)</option>
                {Object.keys(AREAS).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="headline">One-line description</Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bio">About</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="website">Website (optional)</Label>
            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
          <Button className="justify-self-start" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </Page>
  );
}
