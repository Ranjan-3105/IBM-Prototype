# AGENTS.md — SkillBridge Development Instructions

## 1. Project Identity

Project Name: SkillBridge

Tagline: Your skills deserve an opportunity.

SkillBridge is an AI-powered opportunity discovery and matching platform connecting students, local workers, NGOs, startups and small businesses.

The platform matches individuals with internships, freelance projects, part-time jobs, volunteering opportunities and community initiatives based on skills, availability, location and preferences.

The primary objective is to build a functional, secure and demonstrable MVP within a short hackathon deadline.

Before making any changes, understand the project vision from `todo.md` and inspect the existing codebase.

---

## 2. Technology Stack

### Frontend

- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- TanStack Query
- React Hook Form
- Zod
- Axios

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- Zod

### AI

- Gemini API
- AI integration through a dedicated backend service
- Structured JSON responses wherever applicable

### Additional Services

- Cloudinary for file storage
- Leaflet and OpenStreetMap for maps, if required
- Vercel for frontend deployment
- Render for backend deployment

Do not introduce alternative technologies without a clear technical reason and approval.

---

## 3. Architecture Rules

Use a modular monolithic architecture.

The frontend and backend must remain separate.

Frontend communicates with the backend through REST APIs.

Backend modules must maintain separation of concerns:

- Routes handle endpoint definitions.
- Controllers handle HTTP request and response logic.
- Services contain business logic.
- Models define database schemas.
- Validators handle input validation.

Keep AI logic inside dedicated services.

Do not introduce microservices, message brokers, Redis, Kubernetes or other unnecessary infrastructure for the initial MVP.

Avoid overengineering.

---

## 4. Coding Standards

- Use TypeScript throughout the project.
- Prefer explicit types and interfaces.
- Avoid `any` unless absolutely necessary.
- Use async/await for asynchronous operations.
- Handle errors consistently.
- Keep functions focused and reusable.
- Use meaningful variable and function names.
- Avoid duplicated business logic.
- Follow existing naming conventions.
- Keep components small and reusable.
- Avoid unnecessary dependencies.
- Remove unused imports and code.
- Do not leave incomplete TODOs without documenting them.

Do not rewrite working code unnecessarily.

Before modifying an existing file, inspect its current implementation and understand its dependencies.

---

## 5. Frontend Rules

- Use reusable React components.
- Use React Router for navigation.
- Use TanStack Query for server-state management.
- Use React Hook Form and Zod for form validation.
- Keep API calls inside the services layer.
- Use Axios through a centralised API client.
- Keep authentication state and protected routes consistent.
- Implement loading, error and empty states.
- Ensure responsive layouts.
- Follow accessible UI practices.
- Use consistent typography, spacing, colours and components.

Do not place backend business logic inside frontend components.

Do not hardcode production API responses or opportunity records.

---

## 6. Backend Rules

- Use modular routes, controllers, services and models.
- Use Zod to validate incoming request data.
- Use centralised error-handling middleware.
- Keep database operations inside appropriate services or repositories.
- Use environment variables for configuration.
- Implement pagination for potentially large lists.
- Use appropriate MongoDB indexes.
- Avoid unnecessary database queries.
- Return consistent API response structures.
- Verify resource ownership before modifying or deleting records.

Never trust client-provided role, ownership or permission information.

All sensitive operations must be authorised on the backend.

---

## 7. Authentication and Security

- Hash passwords using bcryptjs.
- Never store plain-text passwords.
- Use JWT-based authentication.
- Implement authentication middleware.
- Implement role-based authorisation.
- Validate all incoming data.
- Configure CORS appropriately.
- Apply rate limiting to sensitive endpoints.
- Protect against mass assignment.
- Validate uploaded files.
- Never expose API keys or secrets.
- Never commit `.env` files.
- Keep secrets exclusively on the backend.

Individual users must not access organisation-only functionality.

Organisations must not modify opportunities belonging to other organisations.

Users must not modify applications belonging to other users.

---

## 8. AI Integration Rules

AI is an assistant, not the source of truth.

Use AI for:

1. Skill extraction.
2. Natural-language profile understanding.
3. Opportunity explanations.
4. Skill gap analysis.
5. Natural-language opportunity discovery.

Important restrictions:

- Never allow AI to invent opportunities.
- Never allow AI to invent organisations.
- Never let an LLM independently calculate match scores.
- Never trust AI-generated structured data without validation.
- Never execute AI-generated database commands.
- Keep prompts and API calls inside backend services.
- Handle timeouts, API errors and malformed responses.
- Ask users to confirm extracted skills before saving them.

AI recommendations must be grounded in actual database records.

---

## 9. Matching Engine Rules

The matching engine must be deterministic and testable.

First apply mandatory eligibility filters.

Then calculate a weighted score:

M = 0.40S + 0.20A + 0.15L + 0.15E + 0.10P

Where:

- S = Skill compatibility.
- A = Availability compatibility.
- L = Location compatibility.
- E = Experience/evidence compatibility.
- P = Preference compatibility.

All factors must be normalised between 0 and 100.

The final score must be between 0 and 100.

Mandatory requirements must not be overridden by high scores.

Return a score breakdown, matched skills and missing skills.

Write unit tests for the matching algorithm.

Document any changes to the scoring formula.

---

## 10. Database Rules

Use Mongoose schemas.

Initial collections:

- Users
- Skills
- Opportunities
- Applications
- SkillEvidence
- Matches
- Reviews

Use references between collections where appropriate.

Use canonical skill identifiers to prevent duplicate skill representations.

Add appropriate indexes for frequently queried fields.

Enforce unique email addresses.

Use MongoDB GeoJSON and `2dsphere` indexes only when implementing location-based discovery.

Do not introduce unnecessary collections.

---

## 11. API Design Rules

All API endpoints must use:

`/api`

Follow REST conventions.

Use consistent HTTP status codes.

Validate request parameters, query strings and request bodies.

Use consistent response structures.

Document new endpoints in `docs/API_CONTRACT.md`.

Do not introduce duplicate endpoints.

Maintain compatibility with the existing frontend API client.

---

## 12. Testing Requirements

Write tests for important business logic.

Prioritise:

- Authentication.
- Role-based access.
- Profile updates.
- Opportunity creation and ownership.
- Opportunity filtering.
- Matching score calculation.
- Duplicate application prevention.
- Application status transitions.
- AI response validation.

Run relevant tests after modifying existing functionality.

Do not claim a feature is complete unless it has been implemented and verified.

---

## 13. IBM Bob Workflow

Before starting any task:

1. Read this file.
2. Read `todo.md` for the project roadmap.
3. Inspect the existing repository structure.
4. Inspect relevant existing files.
5. Identify dependencies and potential conflicts.

For every implementation task:

1. Explain the proposed approach.
2. Identify files that will be created or modified.
3. Implement only the requested scope.
4. Follow existing architectural conventions.
5. Run relevant tests or verification commands.
6. Summarise changes.
7. Report unresolved issues.

Use Plan Mode for major architectural decisions.

Use Agent Mode for implementation.

Use Ask Mode for explanations and debugging.

Do not implement large features without first reviewing the plan.

Do not modify unrelated files.

Do not overwrite working implementations without justification.

---

## 14. Git and Change Management

- Keep changes focused.
- Review the Git diff before committing.
- Never commit secrets or generated dependencies.
- Use meaningful commit messages.
- Avoid mixing unrelated features in one commit.
- Do not reset, rebase, force-push or delete branches without explicit permission.
- Do not overwrite user changes.

Suggested commit format:

- `feat: add user authentication`
- `feat: implement opportunity matching`
- `fix: prevent duplicate applications`
- `refactor: separate AI service logic`
- `test: add matching engine tests`
- `docs: update API documentation`

---

## 15. Development Priorities

Prioritise features in this order:

1. Project foundation.
2. Authentication and authorisation.
3. User and organisation profiles.
4. Skills management.
5. Opportunity publishing.
6. Opportunity discovery.
7. Deterministic matching engine.
8. AI explanations and skill extraction.
9. Applications and status tracking.
10. Frontend integration.
11. Testing and security.
12. Deployment and presentation.

Always prioritise a complete working workflow over additional unfinished features.

---

## 16. Definition of Done

A task is considered complete only when:

- The requested functionality is implemented.
- Existing functionality is not broken.
- Input validation is implemented.
- Security and permissions are considered.
- Relevant tests pass.
- No unnecessary files or dependencies are introduced.
- The implementation follows the project architecture.
- The changes are summarised clearly.

If a requirement is ambiguous, ask for clarification rather than making a major architectural assumption.

**Core principle: Build SkillBridge incrementally, securely and pragmatically. Prefer working, tested features over unnecessary complexity.**
