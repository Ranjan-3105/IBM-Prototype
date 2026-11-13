import { Link } from "react-router-dom";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-semibold tracking-tight" aria-label="SkillBridge home">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span className="text-lg">
        Skill<span className="text-primary">Bridge</span>
      </span>
    </Link>
  );
}
