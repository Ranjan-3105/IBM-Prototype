/**
 * Seeds a realistic Bhubaneswar demo: skill catalogue, organisations, opportunities, seekers,
 * evidence, applications and a review. Run with `npm run seed` — it WIPES the SkillBridge collections.
 */
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { env } from "../config/env";
import { Skill } from "../modules/skills/skill.model";
import { SKILL_CATALOGUE } from "../modules/skills/catalogue";
import { User } from "../modules/users/user.model";
import { Opportunity } from "../modules/opportunities/opportunity.model";
import { Application } from "../modules/applications/application.model";
import { SkillEvidence } from "../modules/evidence/evidence.model";
import { Match } from "../modules/matching/match.model";
import { Review } from "../modules/reviews/review.model";
import { evaluate, type OpportunityLike, type SeekerProfile } from "../modules/matching/engine";
import { loadSkillIndex } from "../utils/skills";
import type { AppStatus, OppType, ACCESS_TAGS } from "../modules/common/constants";

type AccessTag = (typeof ACCESS_TAGS)[number];

const DEMO_PASSWORD = "Demo@1234";

/** Real Bhubaneswar localities, [lng, lat]. */
const AREAS = {
  Patia: [85.818, 20.354],
  "Saheed Nagar": [85.844, 20.29],
  Khandagiri: [85.78, 20.256],
  "Old Town": [85.835, 20.24],
  Chandrasekharpur: [85.82, 20.33],
  "Jaydev Vihar": [85.818, 20.3],
  Nayapalli: [85.813, 20.293],
  Infocity: [85.809, 20.338],
  Rasulgarh: [85.86, 20.295],
} as const;
type Area = keyof typeof AREAS;
const at = (area: Area) => ({ type: "Point" as const, coordinates: [...AREAS[area]] });

/** Wipes and re-seeds every SkillBridge collection. Expects an open mongoose connection. */
export async function seedDatabase({ quiet = false } = {}) {
  await Promise.all([
    Skill.deleteMany({}),
    User.deleteMany({}),
    Opportunity.deleteMany({}),
    Application.deleteMany({}),
    SkillEvidence.deleteMany({}),
    Match.deleteMany({}),
    Review.deleteMany({}),
  ]);
  await Promise.all([User.syncIndexes(), Opportunity.syncIndexes(), Application.syncIndexes(), Match.syncIndexes()]);

  // ── Skills ──────────────────────────────────────────────────────────────
  await Skill.insertMany(SKILL_CATALOGUE);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── Admin ───────────────────────────────────────────────────────────────
  await User.create({ name: "SkillBridge Admin", email: "admin@demo.skillbridge", passwordHash, role: "ADMIN" });

  // ── Organisations ───────────────────────────────────────────────────────
  const orgDefs = [
    { key: "shiksha", name: "Shiksha Setu Foundation", email: "ngo@demo.skillbridge", orgType: "NGO", area: "Saheed Nagar", headline: "Free after-school learning for children in urban slums", website: "https://example.org/shiksha-setu" },
    { key: "green", name: "Green Kalinga Collective", email: "green@demo.skillbridge", orgType: "NGO", area: "Khandagiri", headline: "Tree plantation, lake clean-ups and climate awareness" },
    { key: "cafe", name: "Chai & Code Café", email: "cafe@demo.skillbridge", orgType: "SMALL_BUSINESS", area: "Patia", headline: "Student café near the tech campuses — chai, snacks and Wi-Fi" },
    { key: "boutique", name: "Utkal Weaves Boutique", email: "boutique@demo.skillbridge", orgType: "SMALL_BUSINESS", area: "Old Town", headline: "Sambalpuri and Bomkai handloom, direct from weavers" },
    { key: "club", name: "Bhubaneswar Student Developers Club", email: "club@demo.skillbridge", orgType: "COMMUNITY", area: "Patia", headline: "Inter-college tech club running hackathons and open-source projects" },
    { key: "library", name: "Jaydev Vihar Community Library", email: "library@demo.skillbridge", orgType: "COMMUNITY", area: "Jaydev Vihar", headline: "A free neighbourhood library with reading and digital literacy programmes" },
    { key: "events", name: "Ekamra Events Co.", email: "events@demo.skillbridge", orgType: "SMALL_BUSINESS", area: "Nayapalli", headline: "Weddings, college fests and corporate events across Odisha" },
    { key: "sahaya", name: "Sahaya Disability Resource Centre", email: "sahaya@demo.skillbridge", orgType: "NGO", area: "Chandrasekharpur", headline: "Skills, assistive tech and jobs for people with disabilities" },
  ] as const;

  const orgs: Record<string, Types.ObjectId> = {};
  for (const o of orgDefs) {
    const { key, area, ...rest } = o;
    const doc = await User.create({ ...rest, passwordHash, role: "ORGANISATION", area, location: at(area) });
    orgs[key] = doc._id;
  }

  // ── Opportunities ───────────────────────────────────────────────────────
  type S = [skill: string, minLevel: number, mandatory?: boolean];
  const opp = (
    org: string,
    title: string,
    type: string,
    skills: S[],
    o: { remote?: boolean; area?: Area; hours: number; pay: [string, number?]; access?: string[]; description: string; status?: string }
  ) => ({
    organisation: orgs[org],
    title,
    type,
    description: o.description,
    requiredSkills: skills.map(([skill, minLevel, mandatory = false]) => ({ skill, minLevel, mandatory })),
    isRemote: !!o.remote,
    area: o.remote ? "Remote" : o.area,
    location: at(o.area ?? "Saheed Nagar"),
    hoursPerWeek: o.hours,
    compensation: { kind: o.pay[0], ...(o.pay[1] ? { amount: o.pay[1] } : {}) },
    accessibilityProvided: o.access ?? [],
    status: o.status ?? "OPEN",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * (14 + Math.floor(title.length % 20))),
  });

  const oppDefs = [
    // Shiksha Setu Foundation (NGO, education)
    opp("shiksha", "Build our NGO website", "VOLUNTEER", [["react", 2, true], ["html", 2], ["css", 2]], { remote: true, area: "Saheed Nagar", hours: 6, pay: ["UNPAID"], access: ["FLEXIBLE_HOURS"], description: "We have no website and no budget. Help us build a simple, mobile-friendly site that shows our centres, volunteer sign-up and donation details." }),
    opp("shiksha", "Weekend maths & English tutor", "VOLUNTEER", [["teaching", 3, true], ["english", 3]], { area: "Saheed Nagar", hours: 6, pay: ["UNPAID"], access: ["WHEELCHAIR_ACCESS", "QUIET_WORKSPACE"], description: "Teach classes 6–8 on Saturday and Sunday mornings at our Saheed Nagar centre. Lesson plans are provided." }),
    opp("shiksha", "Odia–English translator for learning materials", "FREELANCE", [["odia-translation", 3, true], ["english", 3]], { remote: true, hours: 5, pay: ["PAID", 3000], access: ["FLEXIBLE_HOURS"], description: "Translate short worksheets and parent notices between Odia and English. Work from home at your own pace." }),
    opp("shiksha", "Donor database & Excel reports", "PART_TIME", [["excel", 3, true], ["data-entry", 2]], { area: "Saheed Nagar", hours: 10, pay: ["STIPEND", 4000], access: ["WHEELCHAIR_ACCESS", "FLEXIBLE_HOURS", "SCREEN_READER_FRIENDLY"], description: "Clean our donor list, maintain the Excel tracker and prepare a monthly summary for the trustees. Step-free office with screen-reader friendly systems." }),

    // Green Kalinga Collective (NGO, environment)
    opp("green", "Social media volunteer for tree-plantation drive", "VOLUNTEER", [["social-media", 2, true], ["canva", 2], ["content-writing", 2]], { remote: true, hours: 4, pay: ["UNPAID"], description: "Plan and post Instagram content for our monsoon plantation drive. Templates and photos are provided." }),
    opp("green", "Environmental data analyst intern", "INTERNSHIP", [["data-analysis", 2, true], ["python", 2], ["excel", 3]], { area: "Khandagiri", hours: 12, pay: ["STIPEND", 5000], description: "Analyse air-quality and tree-survival data from our field teams and build simple charts for our annual report." }),
    opp("green", "Clean-up drive event coordinator", "COMMUNITY_PROJECT", [["event-management", 2, true], ["communication", 3]], { area: "Khandagiri", hours: 6, pay: ["UNPAID"], access: ["FLEXIBLE_HOURS"], description: "Coordinate volunteers, materials and local permissions for a monthly lake clean-up near Khandagiri." }),
    opp("green", "Photographer for campaign stories", "VOLUNTEER", [["photography", 3, true]], { area: "Khandagiri", hours: 4, pay: ["UNPAID"], description: "Capture before/after photos and short portraits of volunteers for our campaign stories." }),

    // Chai & Code Café (small business)
    opp("cafe", "MERN stack intern — café ordering app", "INTERNSHIP", [["react", 3, true], ["nodejs", 2, true], ["mongodb", 2, true], ["express", 2]], { area: "Patia", hours: 15, pay: ["STIPEND", 8000], description: "Build a QR-code ordering app for our tables: React front end, Node/Express API and MongoDB. Mentored by our freelance developer." }),
    opp("cafe", "Instagram reels & menu posters", "PART_TIME", [["social-media", 3, true], ["canva", 3], ["video-editing", 2]], { area: "Patia", hours: 8, pay: ["PAID", 6000], description: "Shoot and edit two reels a week and refresh our menu boards. A few hours a week, flexible timing." }),
    opp("cafe", "Weekend barista & customer service", "PART_TIME", [["customer-service", 2, true], ["english", 2]], { area: "Patia", hours: 12, pay: ["PAID", 7000], description: "Serve customers on Saturday and Sunday. Training provided; friendly attitude matters most." }),
    opp("cafe", "Landing page with React + Tailwind", "FREELANCE", [["react", 3, true], ["tailwind", 2], ["javascript", 3]], { remote: true, hours: 8, pay: ["PAID", 10000], description: "Design and build a one-page website for the café with menu, timings and a map. Fully remote." }),

    // Utkal Weaves Boutique (small business)
    opp("boutique", "Product photography for handloom catalogue", "FREELANCE", [["photography", 3, true], ["graphic-design", 2]], { area: "Old Town", hours: 6, pay: ["PAID", 5000], description: "Photograph 60 sarees and dupattas in natural light and prepare catalogue-ready images." }),
    opp("boutique", "Online store setup (WordPress)", "FREELANCE", [["wordpress", 2, true], ["html", 2], ["css", 2], ["seo", 2]], { remote: true, hours: 8, pay: ["PAID", 9000], description: "Set up a WooCommerce store with 40 products, payment links and basic SEO." }),
    opp("boutique", "Social media manager (4 hrs/week)", "PART_TIME", [["social-media", 3, true], ["content-writing", 2], ["canva", 2]], { remote: true, hours: 4, pay: ["PAID", 4000], description: "Post three times a week, reply to DMs and plan festive-season campaigns. The work is informal and never reaches job sites — that's why we're here." }),
    opp("boutique", "Brand refresh: logo & price tags", "FREELANCE", [["graphic-design", 3, true], ["figma", 2], ["canva", 3]], { remote: true, hours: 6, pay: ["PAID", 7000], description: "Refresh our logo and design price tags and carry bags that celebrate Odisha's weaving traditions." }),

    // Student developers club (community)
    opp("club", "Open-source event portal (Java + Spring Boot)", "COMMUNITY_PROJECT", [["java", 3, true], ["spring-boot", 2], ["sql", 2], ["git", 2]], { remote: true, hours: 6, pay: ["UNPAID"], description: "Contribute to the club's open-source portal used by 12 colleges for hackathon registrations." }),
    opp("club", "Hackathon volunteer team", "VOLUNTEER", [["communication", 2, true], ["event-management", 2]], { area: "Patia", hours: 5, pay: ["UNPAID"], access: ["WHEELCHAIR_ACCESS"], description: "Help run registration, mentoring desks and judging logistics at our 24-hour hackathon." }),
    opp("club", "UI/UX mentor for junior members", "VOLUNTEER", [["figma", 4, true], ["ui-design", 4]], { remote: true, hours: 3, pay: ["UNPAID"], description: "Run a fortnightly online Figma clinic for first-year members." }),
    opp("club", "Flutter app for campus lost & found", "COMMUNITY_PROJECT", [["flutter", 2, true], ["rest-api", 2]], { remote: true, hours: 6, pay: ["UNPAID"], description: "Build a small Flutter app that lets students post and claim lost items." }),

    // Community library
    opp("library", "Digital literacy trainer for seniors", "VOLUNTEER", [["teaching", 2, true], ["communication", 3], ["odia-translation", 2]], { area: "Jaydev Vihar", hours: 4, pay: ["UNPAID"], access: ["WHEELCHAIR_ACCESS", "SIGN_LANGUAGE"], description: "Teach senior citizens to use UPI, WhatsApp and DigiLocker safely, in Odia." }),
    opp("library", "Catalogue digitisation assistant", "PART_TIME", [["data-entry", 2, true], ["excel", 2]], { area: "Jaydev Vihar", hours: 12, pay: ["STIPEND", 3500], access: ["WHEELCHAIR_ACCESS", "QUIET_WORKSPACE", "FLEXIBLE_HOURS"], description: "Digitise our 8,000-book catalogue into a spreadsheet. Step-free reading room and flexible hours." }),
    opp("library", "Storytelling sessions for kids (Odia)", "COMMUNITY_PROJECT", [["communication", 3, true], ["odia-translation", 2]], { area: "Jaydev Vihar", hours: 3, pay: ["UNPAID"], description: "Read Odia folk tales to children aged 5–10 every Sunday evening." }),

    // Ekamra Events
    opp("events", "Event photographer (weekends)", "FREELANCE", [["photography", 3, true], ["video-editing", 2]], { area: "Nayapalli", hours: 8, pay: ["PAID", 8000], description: "Shoot college fests and small corporate events on weekends. Own camera preferred." }),
    opp("events", "Event operations assistant", "PART_TIME", [["event-management", 3, true], ["customer-service", 2], ["communication", 2]], { area: "Nayapalli", hours: 15, pay: ["PAID", 9000], description: "Coordinate vendors, guest lists and on-site setup for 4–6 events a month." }),
    opp("events", "Video editor for event reels", "FREELANCE", [["video-editing", 3, true]], { remote: true, hours: 6, pay: ["PAID", 6000], description: "Turn raw event footage into 30-second highlight reels. Fully remote." }),

    // Sahaya Disability Resource Centre
    opp("sahaya", "Accessibility tester (screen readers)", "FREELANCE", [["html", 2, true], ["communication", 2]], { remote: true, hours: 6, pay: ["PAID", 5000], access: ["SCREEN_READER_FRIENDLY", "FLEXIBLE_HOURS"], description: "Test government and NGO websites with screen readers and write clear bug reports." }),
    opp("sahaya", "Python automation intern", "INTERNSHIP", [["python", 3, true], ["excel", 2], ["data-analysis", 2]], { area: "Chandrasekharpur", hours: 15, pay: ["STIPEND", 6000], access: ["WHEELCHAIR_ACCESS", "QUIET_WORKSPACE", "FLEXIBLE_HOURS"], description: "Automate our beneficiary reports with Python scripts. Fully step-free office with accessible washrooms." }),
    opp("sahaya", "Summer coding camp mentor", "VOLUNTEER", [["javascript", 2, true]], { area: "Chandrasekharpur", hours: 6, pay: ["UNPAID"], status: "CLOSED", description: "Mentor a two-week coding camp for students with disabilities. (Closed for this year.)" }),
  ];
  const opps = await Opportunity.insertMany(oppDefs);
  const oppByTitle = (t: string) => {
    const o = opps.find((x) => x.title.startsWith(t));
    if (!o) throw new Error(`seed: no opportunity "${t}"`);
    return o;
  };

  // ── Seekers ─────────────────────────────────────────────────────────────
  type Sk = [skill: string, level: number, source?: "SELF" | "AI_EXTRACTED" | "ENDORSED"];
  const seekerDefs: {
    key: string; name: string; email: string; area: Area; headline: string; bio: string; skills: Sk[];
    hours: number; remoteOnly?: boolean; maxTravelKm?: number; access?: AccessTag[]; types: OppType[]; paidOnly?: boolean;
  }[] = [
    { key: "student", name: "Rahul Sahoo", email: "student@demo.skillbridge", area: "Patia", headline: "2nd-year CSE student · React & Java", bio: "I'm a 2nd-year engineering student. I know Java, React and basic SQL and I've built a couple of college projects, but I have no work experience yet. I can give about 2 hours a day.", skills: [["java", 3], ["react", 3], ["javascript", 3], ["html", 3], ["css", 3], ["sql", 2], ["nodejs", 2], ["express", 1], ["git", 2]], hours: 14, maxTravelKm: 10, types: ["INTERNSHIP", "FREELANCE", "COMMUNITY_PROJECT"] },
    { key: "priya", name: "Priya Das", email: "priya@demo.skillbridge", area: "Rasulgarh", headline: "B.Com student · writer & Canva designer (remote only)", bio: "Final-year B.Com student who writes and designs social posts. I can only work remotely because of college timings.", skills: [["content-writing", 4], ["social-media", 3], ["canva", 3], ["english", 4]], hours: 10, remoteOnly: true, types: ["FREELANCE", "PART_TIME", "VOLUNTEER"] },
    { key: "sourav", name: "Sourav Behera", email: "sourav@demo.skillbridge", area: "Chandrasekharpur", headline: "Wheelchair user · Excel, Python & data entry", bio: "I use a wheelchair and look for step-free workplaces or remote work. Strong with Excel and learning Python.", skills: [["excel", 4], ["data-entry", 4], ["accounting", 3], ["python", 3], ["data-analysis", 2]], hours: 20, maxTravelKm: 8, access: ["WHEELCHAIR_ACCESS"], types: ["PART_TIME", "INTERNSHIP"] },
    { key: "manoj", name: "Manoj Pradhan", email: "manoj@demo.skillbridge", area: "Old Town", headline: "Local photographer & event helper (paid work)", bio: "Twelve years running a small photo studio in Old Town. I need paid part-time or freelance work.", skills: [["photography", 4], ["customer-service", 4], ["event-management", 3], ["odia-translation", 4], ["communication", 3], ["video-editing", 2]], hours: 20, maxTravelKm: 12, types: ["PART_TIME", "FREELANCE"], paidOnly: true },
    { key: "sneha", name: "Sneha Patnaik", email: "sneha@demo.skillbridge", area: "Jaydev Vihar", headline: "UI/UX & graphic designer with a portfolio", bio: "Design student with a Behance portfolio of brand and app work.", skills: [["figma", 4], ["ui-design", 4], ["canva", 4], ["graphic-design", 4, "ENDORSED"], ["photography", 2]], hours: 12, types: ["FREELANCE", "VOLUNTEER"] },
    { key: "ankit", name: "Ankit Rout", email: "ankit@demo.skillbridge", area: "Khandagiri", headline: "Data science student · Python, SQL, Power BI", bio: "3rd-year student interested in data for social good.", skills: [["python", 3], ["sql", 3], ["excel", 4], ["data-analysis", 3], ["power-bi", 2]], hours: 12, maxTravelKm: 10, types: ["INTERNSHIP"] },
    { key: "lipsa", name: "Lipsa Nayak", email: "lipsa@demo.skillbridge", area: "Saheed Nagar", headline: "Retired school teacher · tutoring & Odia", bio: "Taught English for 25 years. I want to give a few hours a week to my community.", skills: [["teaching", 5], ["english", 4], ["odia-translation", 4], ["communication", 4]], hours: 8, maxTravelKm: 6, types: ["VOLUNTEER", "COMMUNITY_PROJECT"] },
  ];

  const seekers: Record<string, InstanceType<typeof User>> = {};
  for (const s of seekerDefs) {
    seekers[s.key] = await User.create({
      name: s.name,
      email: s.email,
      passwordHash,
      role: "SEEKER",
      headline: s.headline,
      bio: s.bio,
      skills: s.skills.map(([skill, level, source = "SELF"]) => ({ skill, level, source })),
      availability: { hoursPerWeek: s.hours, remoteOnly: !!s.remoteOnly, maxTravelKm: s.maxTravelKm ?? 15 },
      accessibilityNeeds: s.access ?? [],
      preferences: { types: s.types, paidOnly: !!s.paidOnly },
      area: s.area,
      location: at(s.area),
    });
  }

  // ── Evidence (proof of ability) ─────────────────────────────────────────
  const ev = (key: string, title: string, kind: string, skills: string[], url: string, description: string, endorsedBy?: string) => ({
    user: seekers[key]!._id, title, kind, skills, url, description,
    ...(endorsedBy ? { endorsedBy: orgs[endorsedBy], endorsedAt: new Date() } : {}),
  });
  await SkillEvidence.insertMany([
    ev("student", "Hostel mess-menu web app", "GITHUB", ["react", "javascript", "css"], "https://github.com/example/mess-menu", "React app that shows the weekly hostel menu and lets students rate meals."),
    ev("student", "Library management system (Java)", "PROJECT", ["java", "sql"], "https://github.com/example/library-java", "Second-semester Java + MySQL project with issue/return tracking."),
    ev("priya", "Blog: 'Odisha's forgotten crafts'", "PORTFOLIO", ["content-writing"], "https://example.com/priya-blog", "Series of five long-form posts on handloom clusters."),
    ev("sneha", "Brand identity for a Puri homestay", "PORTFOLIO", ["graphic-design", "canva", "figma"], "https://example.com/sneha-behance", "Logo, signage and Instagram templates.", "boutique"),
    ev("sourav", "Shop accounts dashboard in Excel", "WORK_SAMPLE", ["excel", "accounting"], "https://example.com/sourav-excel", "Monthly sales and GST dashboard for my uncle's hardware shop."),
    ev("manoj", "Wedding & event photo portfolio", "PORTFOLIO", ["photography"], "https://example.com/manoj-photos", "Selected work from 12 years of local events."),
    ev("ankit", "Bhubaneswar AQI analysis notebook", "GITHUB", ["python", "data-analysis"], "https://github.com/example/bbsr-aqi", "Pandas notebook analysing 3 years of air-quality data."),
  ]);

  // ── Applications (score snapshots come from the real engine) ─────────────
  const evidence = await SkillEvidence.find().lean();
  const apply = async (key: string, oppTitle: string, status: AppStatus, message: string) => {
    const user = seekers[key]!;
    const o = oppByTitle(oppTitle);
    const evidenced = new Set(evidence.filter((e) => String(e.user) === String(user._id)).flatMap((e) => e.skills));
    const m = evaluate(user.toObject() as unknown as SeekerProfile, o.toObject() as unknown as OpportunityLike, evidenced);
    const flow: AppStatus[] = { APPLIED: ["APPLIED"], SHORTLISTED: ["APPLIED", "SHORTLISTED"], ACCEPTED: ["APPLIED", "ACCEPTED"], COMPLETED: ["APPLIED", "ACCEPTED", "COMPLETED"], REJECTED: ["APPLIED", "REJECTED"] }[status] as AppStatus[];
    const history = flow.map((s, i) => ({ status: s, at: new Date(Date.now() - (flow.length - i) * 86_400_000 * 2) }));
    return Application.create({ opportunity: o._id, applicant: user._id, matchScore: m.score, breakdown: m.breakdown, message, status, history });
  };

  await apply("student", "Build our NGO website", "APPLIED", "I've built two React projects and would love to build your site for free.");
  await apply("priya", "Build our NGO website", "APPLIED", "I can't code yet but I can write all the website content!");
  await apply("student", "Open-source event portal", "SHORTLISTED", "I know Java and SQL from my library project.");
  await apply("lipsa", "Weekend maths & English tutor", "APPLIED", "I taught English for 25 years and live nearby.");
  const sneha = await apply("sneha", "Brand refresh", "COMPLETED", "Here is my homestay branding work.");
  await apply("sourav", "Catalogue digitisation assistant", "ACCEPTED", "The step-free reading room is perfect for me.");
  await apply("manoj", "Event photographer", "APPLIED", "Twelve years of event photography in Bhubaneswar.");
  await apply("priya", "Social media volunteer", "APPLIED", "Happy to run your Instagram for the drive.");
  await apply("priya", "Social media manager", "SHORTLISTED", "I manage two pages already.");
  await apply("ankit", "Environmental data analyst intern", "APPLIED", "See my AQI analysis notebook.");

  await Review.create({
    application: sneha._id,
    reviewer: orgs.boutique,
    reviewee: seekers.sneha!._id,
    rating: 5,
    comment: "Delivered a beautiful logo and tag set ahead of schedule.",
    verifiedSkills: ["graphic-design"],
  });

  await loadSkillIndex();
  if (!quiet) {
    console.log(`🌱 Seed complete: ${SKILL_CATALOGUE.length} skills, ${orgDefs.length} organisations, ${opps.length} opportunities, ${seekerDefs.length} seekers`);
  }
  console.log(`   Demo logins (password ${DEMO_PASSWORD}): student@demo.skillbridge · ngo@demo.skillbridge · admin@demo.skillbridge`);
}

// Run as a CLI only when executed directly (`npm run seed`), not when imported by server.ts.
if (require.main === module) {
  (async () => {
    if (env.MONGODB_URI === "memory") {
      console.log("MONGODB_URI=memory: the in-memory database is seeded automatically when the API starts — nothing to do.");
      return;
    }
    await connectDB(env.MONGODB_URI);
    await seedDatabase();
    await mongoose.disconnect();
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
