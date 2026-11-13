import type { SKILL_CATEGORIES } from "../common/constants";

type Category = (typeof SKILL_CATEGORIES)[number];

/** The skill catalogue. Every stored skill is one of these slugs. */
export const SKILL_CATALOGUE: { slug: string; name: string; category: Category; aliases: string[] }[] = [
  // frontend
  { slug: "html", name: "HTML", category: "FRONTEND", aliases: ["html5"] },
  { slug: "css", name: "CSS", category: "FRONTEND", aliases: ["css3"] },
  { slug: "javascript", name: "JavaScript", category: "FRONTEND", aliases: ["js", "ecmascript", "es6"] },
  { slug: "typescript", name: "TypeScript", category: "FRONTEND", aliases: ["ts"] },
  { slug: "react", name: "React", category: "FRONTEND", aliases: ["reactjs", "react.js", "react js"] },
  { slug: "tailwind", name: "Tailwind CSS", category: "FRONTEND", aliases: ["tailwindcss", "tailwind css"] },
  { slug: "wordpress", name: "WordPress", category: "FRONTEND", aliases: ["wp"] },
  // backend
  { slug: "nodejs", name: "Node.js", category: "BACKEND", aliases: ["node", "node js"] },
  { slug: "express", name: "Express", category: "BACKEND", aliases: ["expressjs", "express.js"] },
  { slug: "java", name: "Java", category: "BACKEND", aliases: ["core java", "java8"] },
  { slug: "spring-boot", name: "Spring Boot", category: "BACKEND", aliases: ["springboot", "spring boot"] },
  { slug: "python", name: "Python", category: "BACKEND", aliases: ["py", "python3"] },
  { slug: "django", name: "Django", category: "BACKEND", aliases: [] },
  { slug: "php", name: "PHP", category: "BACKEND", aliases: [] },
  { slug: "rest-api", name: "REST APIs", category: "BACKEND", aliases: ["restful", "api development", "rest api", "rest apis"] },
  { slug: "git", name: "Git & GitHub", category: "BACKEND", aliases: ["github", "version control"] },
  { slug: "flutter", name: "Flutter", category: "FRONTEND", aliases: ["dart"] },
  // data
  { slug: "sql", name: "SQL", category: "DATA", aliases: ["mysql", "postgresql", "postgres", "sqlite"] },
  { slug: "mongodb", name: "MongoDB", category: "DATA", aliases: ["mongo", "mongoose"] },
  { slug: "excel", name: "Excel", category: "DATA", aliases: ["ms excel", "microsoft excel", "spreadsheets", "google sheets"] },
  { slug: "data-analysis", name: "Data Analysis", category: "DATA", aliases: ["data analytics", "analytics", "pandas"] },
  { slug: "power-bi", name: "Power BI", category: "DATA", aliases: ["powerbi"] },
  { slug: "machine-learning", name: "Machine Learning", category: "DATA", aliases: ["ml", "ai/ml"] },
  // design
  { slug: "figma", name: "Figma", category: "DESIGN", aliases: [] },
  { slug: "canva", name: "Canva", category: "DESIGN", aliases: [] },
  { slug: "ui-design", name: "UI/UX Design", category: "DESIGN", aliases: ["ui", "ux", "ui/ux", "ui ux", "user interface design"] },
  { slug: "graphic-design", name: "Graphic Design", category: "DESIGN", aliases: ["photoshop", "illustrator", "poster design"] },
  { slug: "photography", name: "Photography", category: "DESIGN", aliases: ["photo editing", "lightroom"] },
  { slug: "video-editing", name: "Video Editing", category: "DESIGN", aliases: ["premiere pro", "capcut", "reels editing"] },
  // marketing
  { slug: "social-media", name: "Social Media Management", category: "MARKETING", aliases: ["instagram", "social media", "social media marketing", "smm"] },
  { slug: "content-writing", name: "Content Writing", category: "MARKETING", aliases: ["copywriting", "blogging", "writing"] },
  { slug: "seo", name: "SEO", category: "MARKETING", aliases: ["search engine optimisation", "search engine optimization"] },
  { slug: "digital-marketing", name: "Digital Marketing", category: "MARKETING", aliases: ["online marketing", "marketing"] },
  // soft / community
  { slug: "communication", name: "Communication", category: "SOFT", aliases: ["public speaking", "presentation"] },
  { slug: "teaching", name: "Teaching & Tutoring", category: "SOFT", aliases: ["tutoring", "mentoring", "teaching", "tuition"] },
  { slug: "event-management", name: "Event Management", category: "SOFT", aliases: ["event planning", "events"] },
  { slug: "customer-service", name: "Customer Service", category: "SOFT", aliases: ["customer support", "sales"] },
  { slug: "odia-translation", name: "Odia Translation", category: "COMMUNITY", aliases: ["odia", "oriya", "translation"] },
  { slug: "english", name: "English (Spoken & Written)", category: "SOFT", aliases: ["spoken english", "english communication"] },
  { slug: "first-aid", name: "First Aid", category: "COMMUNITY", aliases: ["cpr"] },
  { slug: "accounting", name: "Accounting & Tally", category: "OTHER", aliases: ["tally", "bookkeeping"] },
  { slug: "data-entry", name: "Data Entry", category: "OTHER", aliases: ["typing"] },
];
