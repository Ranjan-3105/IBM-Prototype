import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Page } from "@/layouts/AppLayout";

export default function NotFound() {
  return (
    <Page className="flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className={buttonVariants({ className: "mt-6" })}>
        Back home
      </Link>
    </Page>
  );
}
