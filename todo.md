# SkillBridge — Opportunity Without Barriers

> **An AI-powered platform connecting people's skills to real-world opportunities.**

SkillBridge is a skill-based opportunity discovery and matching platform designed to connect students, local workers, NGOs, startups and small businesses.

Instead of relying entirely on academic qualifications, resumes or professional experience, SkillBridge focuses on what people can actually do, what they want to learn and how much time they can contribute.

The platform uses AI-assisted skill extraction and an explainable matching engine to connect individuals with relevant internships, freelance projects, part-time jobs, volunteering opportunities and community initiatives.

---

# 1. Project Vision

## 1.1 The Problem

Many capable individuals struggle to find opportunities because traditional recruitment platforms often prioritise formal qualifications and previous work experience.

There are several problems:

- Students lack professional experience and struggle to secure their first internship.
- NGOs have difficulty finding volunteers with the right skills and availability.
- Small businesses cannot always afford traditional recruitment.
- Local opportunities are scattered across social media groups and informal networks.
- People with practical skills but limited formal qualifications are often overlooked.
- Existing job platforms rarely explain why an opportunity is suitable or what someone needs to improve.

## 1.2 Our Solution

SkillBridge creates a common platform where individuals and organisations can discover each other based on skills, availability, location and preferences.

An individual creates a profile describing their skills, interests, projects and availability.

An organisation publishes an opportunity describing its requirements, location, time commitment and compensation.

SkillBridge analyses both sides and recommends suitable opportunities to individuals.

AI helps extract skills, understand natural-language descriptions and generate personalised recommendations. A deterministic matching engine calculates match scores to keep recommendations consistent and explainable.

## 1.3 Target Users

### A. Students and Individuals

- College students looking for internships.
- Freshers seeking their first professional experience.
- Freelancers looking for short-term projects.
- Local workers looking for suitable work.
- Individuals interested in volunteering and community projects.

### B. Organisations

- NGOs looking for volunteers.
- Small businesses looking for skilled individuals.
- Startups looking for interns.
- Community organisations looking for project contributors.

---

# 2. Core Product Features

## 2.1 Authentication and Role Management

Users can register and log in under canonical roles:

- Seeker (`SEEKER`): Individual student, fresher, or local worker.
- Organisation (`ORGANISATION`): NGO, small business, or community organisation.
- Admin (`ADMIN`): Administrative role (seeded/managed internally, not available via public registration).

Authentication uses JWT-based stateless access tokens and bcryptjs password hashing.

Each role will have its own dashboard and permissions.

**Individual capabilities:**

- Create and update profiles.
- Add skills and availability.
- Discover recommended opportunities.
- Apply for opportunities.
- Track applications.

**Organisation capabilities:**

- Create an organisation profile.
- Publish opportunities.
- Manage published opportunities.
- View applicants.
- Accept or reject applications.

## 2.2 Skill DNA — Beyond Resumes

Every individual gets a skill-based profile.

Instead of relying only on a resume, users can add:

- Technical skills.
- Non-technical skills.
- Soft skills.
- Projects and portfolio links.
- GitHub profiles.
- Certifications.
- Previous volunteering or work experience.
- Skill proficiency levels.
- Availability and preferences.

The platform will maintain a structured representation of a user's skills.

**AI integration:**

Users can provide a project description, portfolio or profile summary. AI extracts relevant skills and returns structured data.

Example:

Input:

"I developed a task management application using React, Node.js, Express and MongoDB."

Extracted skills:

- React
- Node.js
- Express.js
- MongoDB
- REST API Development

Users must be able to review and confirm extracted skills before they are added to their profiles.

## 2.3 Opportunity Publishing

Organisations can publish opportunities with the following information:

- Opportunity title.
- Description.
- Organisation name.
- Opportunity category.
- Required skills.
- Preferred skills.
- Experience requirements.
- Number of openings.
- Location.
- Remote, onsite or hybrid arrangement.
- Time commitment.
- Required availability.
- Compensation or volunteering status.
- Application deadline.
- Accessibility requirements.

Opportunity categories:

- Internship
- Part-time work
- Freelance project
- Volunteering
- Community project

Organisations should be able to edit, close and manage their opportunities.

## 2.4 Opportunity Intelligence Engine

This is the central feature of SkillBridge.

The system analyses an individual's profile and compares it with published opportunities.

Instead of displaying every opportunity randomly, it prioritises opportunities that are relevant to the individual's actual capabilities and circumstances.

The matching engine considers:

1. Skill compatibility.
2. Availability compatibility.
3. Location compatibility.
4. Experience and demonstrated evidence.
5. User preferences and accessibility requirements.

### Hybrid Matching Algorithm

Matching will consist of two stages.

**Stage 1: Hard filtering**

Remove opportunities that violate essential requirements.

Examples:

- The opportunity is closed.
- The user cannot meet mandatory availability.
- The opportunity requires onsite presence but the user cannot travel there.
- A mandatory accessibility requirement cannot be satisfied.

Accessibility and other explicitly mandatory constraints must never be overridden by a high match score.

**Stage 2: Weighted scoring**

For the remaining opportunities, calculate a score:

M = 0.40S + 0.20A + 0.15L + 0.15E + 0.10P

Where:

- S = Skill compatibility.
- A = Availability compatibility.
- L = Location compatibility.
- E = Experience/evidence compatibility.
- P = Preference compatibility.

All factors are normalised between 0 and 100.

The final score is also between 0 and 100.

Initial match categories:

- 80–100: Excellent match.
- 60–79: Good match.
- 40–59: Potential match.
- Below 40: Low match.

These thresholds are initial design choices and can be adjusted after testing.

**Important:** The matching score must be calculated by backend code, not generated by an LLM. AI is responsible for explaining the results, not arbitrarily deciding eligibility or scores.

### Match Explanation

For every recommended opportunity, show:

- Overall match percentage.
- Skills that match.
- Missing or preferred skills.
- Availability compatibility.
- Location compatibility.
- Why the opportunity is recommended.
- Suggested next steps.

Example:

"Your profile matches this opportunity by 86%.

You already have React, JavaScript and REST API development experience. The organisation is also looking for someone available for 10 hours per week, which matches your availability.

MongoDB experience is preferred but currently missing."

## 2.5 Opportunity Gap Analyzer

This feature ensures that a user is not simply rejected because of missing skills.

Instead, SkillBridge helps the user understand how to become eligible for better opportunities.

For example:

An opportunity requires:

- React
- Node.js
- MongoDB
- Docker

The user possesses:

- React
- Node.js
- MongoDB

The system identifies Docker as the missing skill and suggests:

- What skill is missing.
- Why it matters for the opportunity.
- What the user should learn.
- Alternative opportunities that better match their current abilities.

AI generates personalised learning suggestions using the missing-skill information.

## 2.6 Proof of Ability

Users can attach evidence to demonstrate their actual skills.

Examples:

- GitHub repositories.
- Portfolio websites.
- Project demonstrations.
- Certificates.
- Completed volunteering projects.
- Organisation endorsements.

The goal is to make practical ability more visible than academic qualifications alone.

For the initial MVP, portfolio URLs and project descriptions are sufficient. Automated verification of external repositories can be considered later.

## 2.7 Application Management

Individuals can apply to opportunities.

Application statuses:

- Applied
- Under Review
- Shortlisted
- Accepted
- Rejected
- Withdrawn

Individuals can view their application history.

Organisations can:

- View applicants.
- Inspect individual profiles.
- Review skill matches.
- Update application status.

## 2.8 Signature Feature — Your Next Opportunity

This is the main AI-powered experience that differentiates SkillBridge.

A user can describe their circumstances in natural language.

Example:

"I'm a second-year engineering student. I know Java, React and basic SQL. I can work remotely for two hours daily. I don't have any professional experience, but I have completed two projects."

The AI extracts structured information such as:

- Skills.
- Experience level.
- Availability.
- Work preferences.
- Location constraints.
- Interests.

The backend then searches for suitable opportunities using the matching engine.

The response includes:

1. Recommended opportunities.
2. Match percentages.
3. Reasons for each recommendation.
4. Missing skills.
5. Suggested next steps.

The AI must not invent opportunities. Recommendations must come from actual records stored in the database.

---

# 3. Technology Stack

We will use the MERN stack with TypeScript.

| Layer          | Technology              | Purpose                             |
| -------------- | ----------------------- | ----------------------------------- |
| Frontend       | React + Vite            | User interface                      |
| Language       | TypeScript              | Type safety                         |
| Routing        | React Router            | Page navigation                     |
| Styling        | Tailwind CSS            | Responsive styling                  |
| UI Components  | shadcn/ui               | Consistent UI components            |
| Icons          | Lucide React            | Icons                               |
| Data Fetching  | TanStack Query          | API state management                |
| Forms          | React Hook Form + Zod   | Form handling and validation        |
| Backend        | Node.js + Express       | REST API                            |
| Database       | MongoDB Atlas           | Data persistence                    |
| ODM            | Mongoose                | MongoDB schemas and queries         |
| Authentication | JWT + bcryptjs          | Authentication and password hashing |
| AI             | Gemini API              | Skill extraction and explanations   |
| File Storage   | Cloudinary              | Profile images and uploaded files   |
| Maps           | Leaflet + OpenStreetMap | Location discovery                  |
| Deployment     | Vercel + Render         | Application hosting                 |

### Why MERN?

- Faster development compared with introducing a separate Java backend.
- TypeScript can be used across the frontend and backend.
- React and Express are familiar technologies.
- MongoDB provides flexible document storage for user profiles and opportunities.
- AI integration is straightforward through backend API calls.
- The architecture is suitable for a hackathon MVP.

### Why Vite instead of Next.js?

We do not need server-side rendering or complex server components for this prototype.

Vite provides a lightweight React development environment and allows us to keep the frontend and backend independently structured.

---

# 4. System Architecture

We will follow a **modular monolithic architecture**.

Microservices are unnecessary for the initial prototype.

```text
                  USER
                   |
                   v
           REACT FRONTEND
             (Vite + TS)
                   |
                   v
             REST API
          (Axios / HTTP)
                   |
                   v
           EXPRESS BACKEND
                   |
        +----------+----------+
        |          |          |
        v          v          v
     AUTH       MATCHING     AI SERVICE
    MODULE      MODULE       (Gemini)
        |          |          |
        +----------+----------+
                   |
                   v
              MONGODB
             (Atlas)
                   |
          +--------+--------+
          |                 |
          v                 v
      CLOUDINARY       GEO QUERIES
      FILE STORAGE     (MongoDB)
```

### Backend Modules

1. Auth Module
2. Users Module
3. Skills Module
4. Opportunities Module
5. Matching Module
6. Applications Module
7. Reviews and Verification Module

### Services

- AI Service
- Matching Service
- Storage Service
- Email/Notification Service (optional for MVP)

Each module should contain its own routes, controller, service and model where appropriate.

---

# 5. Database Design

We will use MongoDB collections.

## 5.1 Users

Stores individual and organisation accounts.

Important fields:

- name
- email
- passwordHash
- role
- profileImage
- location
- availability
- preferences
- createdAt
- updatedAt

Individual-specific profile information can be embedded or stored in a related profile document, depending on the final schema.

## 5.2 Skills

Stores canonical skills.

Fields:

- name
- normalizedName
- category
- description

A canonical skill taxonomy helps avoid duplicate representations such as React, ReactJS and React.js.

## 5.3 Opportunities

Stores opportunities published by organisations.

Fields:

- title
- description
- organisationId
- category
- requiredSkills
- preferredSkills
- experienceRequirements
- location
- workMode
- availabilityRequirements
- compensation
- accessibilityRequirements
- openings
- deadline
- status
- createdAt

## 5.4 Applications

Stores applications submitted by individuals.

Fields:

- userId
- opportunityId
- coverMessage
- matchScore
- status
- appliedAt
- updatedAt

## 5.5 SkillEvidence

Stores proof of an individual's skills.

Fields:

- userId
- skillId
- evidenceType
- title
- description
- externalUrl
- verificationStatus

## 5.6 Reviews

Stores feedback and verified work history.

Fields:

- reviewerId
- revieweeId
- opportunityId
- rating
- feedback
- createdAt

## 5.7 Matches

Stores calculated match results when persistence or caching is useful.

Fields:

- userId
- opportunityId
- score
- scoreBreakdown
- matchedSkills
- missingSkills
- explanation
- calculatedAt

For the MVP, matches may also be calculated dynamically rather than persisting every possible user-opportunity combination.

---

# 6. Frontend Pages and User Experience

The frontend should look like a modern, professional opportunity platform.

We should prioritise clean design, accessibility, responsiveness and ease of navigation.

## Public Pages

- Landing Page
- About SkillBridge
- Login
- Registration

## Individual Dashboard

- Overview
- My Profile
- My Skills
- My Portfolio
- Recommended Opportunities
- Explore Opportunities
- AI Opportunity Assistant
- Skill Gap Analysis
- My Applications
- Settings

## Organisation Dashboard

- Organisation Overview
- Organisation Profile
- Publish Opportunity
- Manage Opportunities
- View Applicants
- Application Management
- Settings

## Opportunity Details Page

Every opportunity should display:

- Title and organisation.
- Description.
- Required and preferred skills.
- Work arrangement.
- Location.
- Compensation.
- Time commitment.
- Deadline.
- Match percentage, when viewed by an eligible individual.
- Apply button.

## UI Design Direction

The design should be:

- Modern and minimal.
- Responsive across mobile and desktop.
- Easy to navigate.
- Accessible with clear typography and contrast.
- Consistent in spacing, colours and components.

Use a consistent design system rather than creating every component independently.

Avoid unnecessary animations and decorative elements that compromise performance or usability.

---

# 7. API Design

All backend routes use the `/api` prefix (canonical contract).

Initial API contract:

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

## Users

```text
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id
```

## Skills

```text
GET    /api/skills
POST   /api/skills
PUT    /api/users/me/skills
POST   /api/skills/extract
```

## Opportunities

```text
POST   /api/opportunities
GET    /api/opportunities
GET    /api/opportunities/:id
PUT    /api/opportunities/:id
DELETE /api/opportunities/:id
```

## Matching

```text
GET    /api/matches/me
GET    /api/matches/:opportunityId
POST   /api/matches/analyze
```

## Applications

```text
POST   /api/applications
GET    /api/applications/me
GET    /api/opportunities/:id/applications
PATCH  /api/applications/:id/status
```

## AI Assistant

```text
POST   /api/ai/extract-skills
POST   /api/ai/opportunity-assistant
POST   /api/ai/gap-analysis
```

The final API contract must be reviewed before implementation. Avoid duplicate routes that perform the same operation.

All protected routes must verify authentication and role permissions.

---

# 8. Security and Reliability

Security is part of the implementation, not an optional final step.

We must implement:

- Password hashing using bcrypt.
- JWT authentication.
- Role-based access control.
- Input validation using Zod.
- Server-side validation for every sensitive operation.
- Secure environment variable handling.
- CORS configuration.
- Rate limiting for authentication and AI endpoints.
- Proper error handling.
- Protection against mass assignment.
- Ownership checks before modifying opportunities or applications.
- File upload validation.
- No exposure of API keys in frontend code.

AI-specific precautions:

- Treat user-provided descriptions and uploaded content as untrusted input.
- Request structured JSON output where appropriate.
- Validate AI responses before using them.
- Do not allow AI output to directly execute database operations.
- Never allow AI to invent database records or application statuses.
- Keep the Gemini API key on the backend.

---

# 9. IBM Bob — Development Workflow

IBM Bob will be our AI development partner throughout the project.

We should not use it merely to generate isolated code snippets. We should use it systematically across planning, implementation, testing, debugging and code review.

## 9.1 Project Context

Before implementation, provide Bob with the complete project README and establish project-level instructions.

Create an `AGENTS.md` file in the root directory.

It should contain:

- Project overview.
- Technology stack.
- Architecture rules.
- Folder structure.
- Coding conventions.
- API design conventions.
- Security requirements.
- Database design rules.
- AI integration rules.
- Testing requirements.
- Instructions not to introduce unnecessary dependencies or architectural complexity.

This ensures that Bob has consistent project context across development tasks.

## 9.2 Bob's Modes

Use the available Bob modes according to the task.

**Plan Mode**

Use for:

- Analysing requirements.
- Designing architecture.
- Planning database schemas.
- Defining API contracts.
- Breaking features into implementation tasks.
- Identifying risks and dependencies.

Do not ask Bob to implement major features before reviewing the plan.

**Agent Mode**

Use for:

- Creating files.
- Implementing backend modules.
- Building React pages.
- Connecting APIs.
- Writing tests.
- Fixing bugs.

Give Bob small, well-defined implementation tasks.

**Ask Mode**

Use for:

- Understanding existing code.
- Debugging errors.
- Comparing implementation approaches.
- Explaining unfamiliar code.
- Reviewing potential security issues.

## 9.3 Development Phases with IBM Bob

### Phase 1 — Project Analysis and Planning

Give Bob the complete README.

Ask it to:

1. Understand the problem and product vision.
2. Review the proposed architecture.
3. Identify missing requirements.
4. Design the MongoDB schemas.
5. Finalise the API contracts.
6. Identify implementation dependencies.
7. Prepare a prioritised development plan.

Do not begin large-scale implementation until the architecture is approved.

### Phase 2 — Backend Foundation

Ask Bob to implement:

- Express application.
- TypeScript configuration.
- MongoDB connection.
- Environment configuration.
- Centralised error handling.
- Request validation.
- Health-check endpoint.

Verify that the backend starts successfully and connects to MongoDB.

### Phase 3 — Authentication

Ask Bob to implement:

- Registration.
- Login.
- Password hashing.
- JWT generation and verification.
- Authentication middleware.
- Role-based access control.
- Protected routes.

Test both individual and organisation registration.

### Phase 4 — User Profiles and Skills

Implement:

- Individual profile management.
- Organisation profile management.
- Skill management.
- Availability management.
- Preferences.
- Portfolio and evidence links.

Use Bob to generate schemas, controllers, services, routes and validation.

### Phase 5 — Opportunity Management

Implement:

- Opportunity creation.
- Opportunity listing.
- Opportunity details.
- Opportunity editing.
- Opportunity deletion or closure.
- Filtering and pagination.
- Organisation ownership checks.

Test the complete opportunity publishing workflow before moving forward.

### Phase 6 — Matching Engine

Ask Bob to implement the deterministic hybrid matching algorithm.

Requirements:

1. Apply mandatory filters first.
2. Calculate skill compatibility.
3. Calculate availability compatibility.
4. Calculate location compatibility.
5. Calculate experience/evidence compatibility.
6. Calculate preference compatibility.
7. Return an explainable score breakdown.
8. Rank opportunities.
9. Handle missing profile information gracefully.

Write unit tests for the scoring algorithm.

Use AI only for natural-language explanations, not score calculation.

### Phase 7 — AI Integration

Implement the AI service using the Gemini API.

Initial AI features:

- Skill extraction.
- Natural-language profile understanding.
- Opportunity explanation.
- Skill gap analysis.
- Your Next Opportunity assistant.

Ask Bob to:

- Create a reusable AI service.
- Define structured request and response schemas.
- Validate AI-generated output.
- Handle API failures and timeouts.
- Avoid exposing API keys.
- Keep the AI layer separate from the matching engine.

### Phase 8 — Applications

Implement:

- Apply to opportunity.
- View applications.
- View applicants.
- Update application status.
- Prevent duplicate applications.
- Validate opportunity availability and deadlines.

### Phase 9 — Frontend Development

Build the frontend in this order:

1. Design system and reusable components.
2. Landing page.
3. Authentication pages.
4. Individual dashboard.
5. Individual profile and skills.
6. Opportunity discovery.
7. Opportunity details.
8. Match explanations.
9. AI assistant and gap analysis.
10. Application tracking.
11. Organisation dashboard.
12. Opportunity publishing and applicant management.

Use Bob to build components in small groups and follow the agreed API contract.

### Phase 10 — Integration

Connect the frontend to the backend.

Verify:

- Registration and login.
- Protected routes.
- Profile creation.
- Skill management.
- Opportunity publishing.
- Opportunity discovery.
- Match recommendations.
- AI explanations.
- Application submission.
- Organisation application management.

Do not consider a feature complete just because its frontend page exists. Verify its full database-to-UI workflow.

### Phase 11 — Testing and Security Review

Ask Bob to review the entire project.

Focus on:

- Authentication vulnerabilities.
- Role permission errors.
- Invalid input handling.
- Duplicate applications.
- Matching score correctness.
- Missing or inconsistent database fields.
- AI response validation.
- API error handling.
- Responsive UI.
- Loading, empty and error states.

Use automated tests wherever practical.

### Phase 12 — Deployment

Deploy:

- Frontend: Vercel.
- Backend: Render.
- Database: MongoDB Atlas.
- File storage: Cloudinary.

Configure production environment variables.

Verify CORS, API connectivity, authentication, database access and AI integration in production.

---

# 10. IBM Bob Prompting Strategy

To get reliable results, every implementation request should specify:

1. What feature we are implementing.
2. Which existing files Bob should inspect.
3. What the expected behaviour is.
4. Which APIs and database models are involved.
5. What security requirements apply.
6. What tests must pass.
7. What files should not be modified.

### Example Backend Prompt

```text
We are implementing the authentication module
for SkillBridge.

Before making changes:
1. Inspect the existing project structure.
2. Read AGENTS.md and the project README.
3. Check the existing database and API conventions.

Requirements:
- Individual and organisation registration.
- Login using email and password.
- Hash passwords using bcrypt.
- JWT-based authentication.
- Role-based access control.
- Zod validation.
- Centralised error handling.

Keep the implementation modular and consistent
with the existing architecture.

Do not introduce unnecessary dependencies.
Do not expose secrets.
Do not modify unrelated modules.

Write appropriate tests and explain:
- Files created or modified.
- API endpoints implemented.
- Security considerations.
- Commands required to test the module.
```

### Example Code Review Prompt

```text
Review the current SkillBridge implementation.

Look for:
- Security vulnerabilities.
- Incorrect business logic.
- TypeScript errors.
- Inconsistent API contracts.
- Database design issues.
- Unnecessary dependencies.
- Missing validation.
- Poor error handling.
- Performance problems.

Do not immediately rewrite the project.

First provide a prioritised list of findings
with file references and suggested fixes.

Wait for approval before making major
architectural changes.
```

### Important Bob Rules

- Never blindly accept generated code.
- Review database schemas and API contracts.
- Do not let multiple agents modify shared files simultaneously.
- Avoid implementing the same feature in multiple places.
- Run tests after each major module.
- Review the Git diff before committing.
- Keep `.env` files and credentials out of Git.
- Commit working features separately.
- Ask Bob to explain unfamiliar code instead of accepting it without understanding.

---

# 11. Development Roadmap

The following is an accelerated five-day hackathon plan.

| Day   | Focus                                         | Deliverable                                  |
| ----- | --------------------------------------------- | -------------------------------------------- |
| Day 1 | Setup, architecture, database, authentication | Working backend and authentication           |
| Day 2 | Profiles, skills and opportunities            | Users can publish and discover opportunities |
| Day 3 | Matching and AI integration                   | Working recommendations and explanations     |
| Day 4 | Applications and frontend integration         | Complete user and organisation workflows     |
| Day 5 | Testing, UI polish and deployment             | Demonstrable end-to-end MVP                  |

Adjust the schedule according to the actual deadline.

## MVP Priority

### Must Have

- Individual registration and login.
- Organisation registration and login.
- Individual skill profiles.
- Organisation opportunity publishing.
- Opportunity discovery.
- Deterministic matching engine.
- Match explanations.
- Application submission.
- Application status tracking.

### High Priority

- AI skill extraction.
- AI opportunity assistant.
- Opportunity Gap Analyzer.
- Portfolio links.
- Location-based discovery.

### Future Enhancements

- In-app messaging.
- Notifications.
- Organisation verification.
- Skill endorsements.
- Advanced map discovery.
- Automated portfolio analysis.
- More advanced recommendation models.
- Analytics dashboards.

We should prioritise a complete working MVP over implementing every possible feature.

---

# 12. Complete Demonstration Workflow

The final demo should show one complete real-world journey.

### Step 1 — Individual Registration

A student creates an account and enters their skills, projects, availability and preferences.

### Step 2 — Organisation Registration

An NGO or small business creates an organisation account.

### Step 3 — Publish an Opportunity

The organisation publishes an opportunity requiring React, JavaScript and basic backend knowledge.

### Step 4 — AI Skill Understanding

An individual provides their project description.

AI extracts relevant skills and asks the user to confirm them.

### Step 5 — Opportunity Matching

The matching engine compares the user's profile against available opportunities.

### Step 6 — Personalised Recommendations

The individual sees ranked opportunities with match percentages and explanations.

### Step 7 — Skill Gap Analysis

For an opportunity where the individual lacks a preferred skill, the platform identifies the gap and suggests improvements.

### Step 8 — Application

The individual applies to an opportunity.

### Step 9 — Organisation Review

The organisation views the applicant's profile, matched skills and portfolio evidence.

### Step 10 — Application Status

The organisation shortlists or accepts the individual, and the individual sees the updated application status.

This is the core end-to-end experience we must make work reliably.

---

# 13. Success Criteria

The project should be judged by the quality of the working experience, not simply the number of features.

### Completeness and Feasibility

- Both user types can complete their workflows.
- Opportunities can be published and discovered.
- Matching and applications work end to end.
- The system is deployable and stable.

### Creativity and Innovation

- Skill-based profiles instead of resume-only filtering.
- Explainable matching.
- AI-powered skill extraction.
- Opportunity Gap Analyzer.
- Natural-language opportunity discovery.

### Design and Usability

- Clean and responsive interface.
- Simple onboarding.
- Understandable match explanations.
- Accessible and consistent components.
- Useful loading, empty and error states.

### Effectiveness and Efficiency

- Relevant opportunity recommendations.
- Efficient database queries.
- Deterministic and testable scoring.
- Minimal unnecessary AI calls.
- Fast and reliable user interactions.

---

# 14. Project Development Rules

These rules apply to both human development and IBM Bob.

1. Follow the agreed modular monolithic architecture.
2. Use TypeScript throughout the frontend and backend.
3. Keep frontend, backend and AI responsibilities separate.
4. Use Zod for input validation.
5. Keep all secrets on the backend.
6. Do not hardcode sample data into production workflows.
7. Do not let AI independently determine match scores.
8. Do not invent opportunities or organisations in AI responses.
9. Use reusable React components.
10. Maintain consistent API response formats.
11. Implement authentication and authorisation on the backend.
12. Write tests for important business logic.
13. Do not introduce microservices or unnecessary infrastructure.
14. Avoid unnecessary dependencies and overengineering.
15. Keep documentation updated when architecture or APIs change.

---

# 15. Initial Repository Structure

```text
skillbridge/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── opportunities/
│       │   └── profile/
│       ├── pages/
│       │   ├── auth/
│       │   ├── student/
│       │   ├── organisation/
│       │   └── shared/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       ├── types/
│       ├── layouts/
│       ├── routes/
│       ├── App.tsx
│       └── main.tsx
│
├── server/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── skills/
│       │   ├── opportunities/
│       │   ├── matching/
│       │   ├── applications/
│       │   └── reviews/
│       ├── services/
│       │   ├── ai.service.ts
│       │   └── storage.service.ts
│       ├── utils/
│       ├── app.ts
│       └── server.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DATABASE_SCHEMA.md
│   └── IBM_BOB_USAGE.md
│
├── AGENTS.md
├── README.md
└── .gitignore
```

The structure can evolve as implementation progresses, but major architectural changes should be documented.

---

# 16. Immediate Next Steps

We have already initialized the Git repository and created the initial React + Vite frontend and Express backend package configuration.

Our next steps are:

- [ ] Complete and commit the initial project setup.
- [ ] Create the root-level AGENTS.md.
- [ ] Configure backend TypeScript and development scripts.
- [ ] Create the Express application entry point.
- [ ] Connect MongoDB Atlas.
- [ ] Implement a health-check endpoint.
- [ ] Ask IBM Bob to review the architecture and finalise database schemas.
- [ ] Finalise API contracts.
- [ ] Begin authentication implementation.

**First milestone:** A working React frontend communicating with an Express backend connected to MongoDB Atlas, with a functional authentication flow.

---

# Final Product Statement

SkillBridge is more than another job portal.

It is a platform that helps people discover opportunities based on their actual skills, availability and potential rather than limiting them by their lack of formal experience.

By combining structured skill profiles, explainable matching algorithms and AI-assisted discovery, SkillBridge aims to make opportunities more accessible to students, local workers, NGOs and small businesses.

**SkillBridge — Your skills deserve an opportunity.**
