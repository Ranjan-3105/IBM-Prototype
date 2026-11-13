# Test report

Run on 2026-11-11 against a local MongoDB 8 with the seed data and **no Gemini key** (fallback mode).

## Automated

- `server: npm test` — 16 vitest tests, all passing: weights sum to 1; remote-only seeker never sees
  on-site roles; missing mandatory skill blocks and is named; accessibility blocks on-site but not
  remote; perfect seeker = 100; evidence raises E; distance limit; paid-only; edge cases (no skills,
  no location, zero hours, empty requiredSkills); partial-level credit; keyword baseline;
  "React.js"/"ReactJS"/"react" → `react`; catalogue keys unambiguous; fallback extraction of the
  demo sentence (Java 2, React 2, SQL 1, 14 h/week, remote); template explanation states the score.
- `server: npm run build` and `client: npm run build` — no TypeScript errors. `client: npm run lint` — clean.

## Golden journey (API and browser, end to end)

1. Student logs in → 4 eligible matches out of 28, evaluated in < 1 ms (vs 1 with keyword-only matching).
2. MERN internship appears as a near miss ("Missing mandatory skill: MongoDB") → Gap Analyzer shows
   have/missing/learn next and 3 roles the student already qualifies for.
3. "Your Next Opportunity" with the demo sentence → skill profile, top 3 with %, next step.
4. NGO posts a new opportunity through the form → it appears in the student's matches.
5. NGO opens applicants (ranked by live score) → accepts the student → endorses GitHub evidence →
   reviews and verifies skills → student's evidence score rises from 56% to 67%.
6. Admin stats render (match rate, speed, demand vs supply). No browser console errors.

## Security checks

- Seeker calling an organisation route → 403. Another organisation editing or reading the NGO's
  opportunity/applicants → 403. Duplicate application → 409. Endorsing before acceptance → 403.
- Registration as ADMIN or with invalid input → 400 with zod issues. `passwordHash` never appears in responses.

## Not covered / known limitations

- Live Gemini responses were not exercised here (no key in the test environment); the code paths
  are the same as the README's and are guarded by timeouts + zod + fallbacks.
- No automated frontend tests; UI was checked with scripted Playwright runs on desktop and mobile widths.
- Rate limiting and refresh tokens are out of scope for the prototype.
