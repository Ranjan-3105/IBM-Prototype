import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" size="sm" className="-ml-3 mb-4" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}>
      <ArrowLeft aria-hidden /> Back
    </Button>
  );
}
