import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PageLoader } from "@/components/common/States";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
const Landing = lazy(() => import("@/pages/shared/Landing"));
const Browse = lazy(() => import("@/pages/shared/Browse"));
const OpportunityDetails = lazy(() => import("@/pages/shared/OpportunityDetails"));
const NotFound = lazy(() => import("@/pages/shared/NotFound"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const SeekerDashboard = lazy(() => import("@/pages/seeker/Dashboard"));
const Profile = lazy(() => import("@/pages/seeker/Profile"));
const Matches = lazy(() => import("@/pages/seeker/Matches"));
const Gap = lazy(() => import("@/pages/seeker/Gap"));
const Assistant = lazy(() => import("@/pages/seeker/Assistant"));
const Applications = lazy(() => import("@/pages/seeker/Applications"));
const OrgDashboard = lazy(() => import("@/pages/organisation/Dashboard"));
const PostOpportunity = lazy(() => import("@/pages/organisation/PostOpportunity"));
const Applicants = lazy(() => import("@/pages/organisation/Applicants"));
const OrgProfile = lazy(() => import("@/pages/organisation/OrgProfile"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

const seeker = (el: React.ReactNode) => <ProtectedRoute roles={["SEEKER"]}>{el}</ProtectedRoute>;
const org = (el: React.ReactNode) => <ProtectedRoute roles={["ORGANISATION"]}>{el}</ProtectedRoute>;

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/opportunities" element={<Browse />} />
        <Route path="/opportunities/:id" element={<OpportunityDetails />} />

        <Route path="/seeker" element={seeker(<SeekerDashboard />)} />
        <Route path="/seeker/profile" element={seeker(<Profile />)} />
        <Route path="/seeker/matches" element={seeker(<Matches />)} />
        <Route path="/seeker/gap/:id" element={seeker(<Gap />)} />
        <Route path="/seeker/assistant" element={seeker(<Assistant />)} />
        <Route path="/seeker/applications" element={seeker(<Applications />)} />

        <Route path="/org" element={org(<OrgDashboard />)} />
        <Route path="/org/new" element={org(<PostOpportunity />)} />
        <Route path="/org/opportunities/:id/edit" element={org(<PostOpportunity />)} />
        <Route path="/org/opportunities/:id/applicants" element={org(<Applicants />)} />
        <Route path="/org/profile" element={org(<OrgProfile />)} />

        <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<Navigate to="/seeker" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
