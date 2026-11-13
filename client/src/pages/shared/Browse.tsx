import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SearchX } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { PageHeader, ListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { ApplyButton } from "@/components/opportunities/ApplyButton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { opportunitiesApi, type OpportunityQuery } from "@/services/opportunities";
import { useAuth } from "@/hooks/useAuth";
import { AREAS, OPP_TYPES, type OppType } from "@/types";
import { titleCase } from "@/lib/utils";

export default function Browse() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [type, setType] = useState<OppType | "">("");
  const [remote, setRemote] = useState<"" | "true" | "false">("");
  const [near, setNear] = useState("");
  const [km, setKm] = useState(5);

  const params: OpportunityQuery = {
    ...(q.trim() ? { q: q.trim() } : {}),
    ...(type ? { type } : {}),
    ...(remote ? { remote } : {}),
    ...(near && AREAS[near] ? { near: AREAS[near].join(","), km } : {}),
  };
  const query = useQuery({ queryKey: ["opportunities", params], queryFn: () => opportunitiesApi.list(params) });

  return (
    <Page>
      <PageHeader title="Explore opportunities" description="Internships, part-time work, freelance gigs, volunteering and community projects across Bhubaneswar." />
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_6rem]">
        <div className="grid gap-1.5">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="q" className="pl-9" placeholder="Title, description or area" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="type">Type</Label>
          <Select id="type" value={type} onChange={(e) => setType(e.target.value as OppType | "")}>
            <option value="">All types</option>
            {OPP_TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="remote">Mode</Label>
          <Select id="remote" value={remote} onChange={(e) => setRemote(e.target.value as "" | "true" | "false")}>
            <option value="">Remote & on-site</option>
            <option value="true">Remote only</option>
            <option value="false">On-site only</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="near">Near</Label>
          <Select id="near" value={near} onChange={(e) => setNear(e.target.value)}>
            <option value="">Anywhere</option>
            {Object.keys(AREAS).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="km">Radius</Label>
          <Select id="km" value={km} disabled={!near} onChange={(e) => setKm(Number(e.target.value))}>
            {[2, 5, 10, 20].map((k) => (
              <option key={k} value={k}>
                {k} km
              </option>
            ))}
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState icon={<SearchX className="size-6" />} title="No opportunities match these filters" description="Try a wider radius or clear the type filter." />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {query.data.length} opportunit{query.data.length === 1 ? "y" : "ies"}
            {near ? ` within ${km} km of ${near} (plus remote)` : ""}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.map((o) => (
              <OpportunityCard key={o._id} opp={o} footer={user?.role === "SEEKER" ? <ApplyButton opportunityId={o._id} /> : undefined} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
