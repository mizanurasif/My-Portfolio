import { getDb } from "@/lib/mongodb";

export type SubProject = {
  name: string;
  stack: string;
  period: string;
  link: string;
  points: string[];
};

export type Job = {
  company: string;
  location: string;
  role: string;
  period: string;
  points: string[];
  projects: SubProject[];
};

export type Project = {
  name: string;
  stack: string;
  link: string;
  points: string[];
};

export type Education = {
  school: string;
  location: string;
  degree: string;
  period: string;
};

export type Skill = {
  label: string;
  /** Comma-separated list, rendered as chips. */
  items: string;
};

export type Achievement = {
  label: string;
  text: string;
  link: string;
};

export type Portfolio = {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string[];
  skills: Skill[];
  experience: Job[];
  projects: Project[];
  education: Education[];
  achievements: Achievement[];
};

// The whole portfolio is one document with a fixed id.
const COLLECTION = "Portfolio";
const DOC_ID = "main";

type PortfolioDoc = Portfolio & { _id: string; updatedAt?: Date };

async function collection() {
  return (await getDb()).collection<PortfolioDoc>(COLLECTION);
}

/** Returns the saved portfolio, or the resume defaults if nothing is saved yet. */
export async function getPortfolio(): Promise<Portfolio> {
  const doc = await (await collection()).findOne({ _id: DOC_ID });
  // normalizePortfolio drops _id/updatedAt and fills any missing fields.
  return doc ? normalizePortfolio(doc) : defaultPortfolio;
}

export async function savePortfolio(portfolio: Portfolio): Promise<void> {
  await (await collection()).replaceOne(
    { _id: DOC_ID },
    { ...portfolio, updatedAt: new Date() },
    { upsert: true }
  );
}

/** Only allow links that are safe to put in an href. */
export function safeUrl(url: string): string | undefined {
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : undefined;
}

type Obj = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const lines = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const list = <T>(v: unknown, map: (o: Obj) => T): T[] =>
  Array.isArray(v)
    ? v.filter((o): o is Obj => !!o && typeof o === "object").map(map)
    : [];

/** Coerce untrusted input (form JSON or an old document) into a clean Portfolio. */
export function normalizePortfolio(input: unknown): Portfolio {
  const p = (input && typeof input === "object" ? input : {}) as Obj;

  return {
    name: str(p.name),
    headline: str(p.headline),
    location: str(p.location),
    email: str(p.email),
    phone: str(p.phone),
    linkedin: str(p.linkedin),
    github: str(p.github),
    summary: lines(p.summary),
    skills: list(p.skills, (s) => ({ label: str(s.label), items: str(s.items) })),
    experience: list(p.experience, (j) => ({
      company: str(j.company),
      location: str(j.location),
      role: str(j.role),
      period: str(j.period),
      points: lines(j.points),
      projects: list(j.projects, (sp) => ({
        name: str(sp.name),
        stack: str(sp.stack),
        period: str(sp.period),
        link: str(sp.link),
        points: lines(sp.points),
      })),
    })),
    projects: list(p.projects, (pr) => ({
      name: str(pr.name),
      stack: str(pr.stack),
      link: str(pr.link),
      points: lines(pr.points),
    })),
    education: list(p.education, (e) => ({
      school: str(e.school),
      location: str(e.location),
      degree: str(e.degree),
      period: str(e.period),
    })),
    achievements: list(p.achievements, (a) => ({
      label: str(a.label),
      text: str(a.text),
      link: str(a.link),
    })),
  };
}

/** Seed data, taken from Md_Mizanur_Rahman_Master_Resume.html. */
export const defaultPortfolio: Portfolio = {
  name: "MD. Mizanur Rahman",
  headline: "Software Engineer",
  location: "Dhaka, Bangladesh",
  email: "mizanurasif02@gmail.com",
  phone: "+880 1618 070639",
  linkedin: "https://www.linkedin.com/in/mizanur-rahman-asif",
  github: "https://github.com/mizanurasif",
  summary: [
    "Software Engineer with 2.5+ years at Samsung R&D Institute Bangladesh, building developer tooling, cross-platform desktop apps, and mobile device plugins in C#, JavaScript (Node.js), TypeScript, and Rust, and owning features from design through release and support.",
    "Builds async Python backends in personal work: a FastAPI + PostgreSQL platform with JWT auth, AWS S3 storage, Alembic migrations, and an isolated async test suite.",
    "Strong debugging in large existing codebases (Visual Studio Common Project System, Tizen SDK toolchains, binary device protocols), backed by a KUET CSE degree and 650+ solved algorithm problems.",
    "Hands-on information security experience from ISO 27001 / ISMS consulting: risk assessment, control selection, and audit evidence.",
  ],
  skills: [
    { label: "Languages", items: "C#, Python, C, C++, JavaScript/TypeScript, Rust, Kotlin" },
    {
      label: "Backend & Web",
      items:
        "FastAPI, ASP.NET Core, SQLAlchemy 2.0, Pydantic v2, Alembic, React, Node.js, Jinja2, REST API design, PyTorch",
    },
    { label: "Databases", items: "SQL, PostgreSQL, SQL Server" },
    { label: "Cloud & DevOps", items: "Docker, Kubernetes, Git, Linux" },
    {
      label: "Desktop & Tooling",
      items: ".NET, Visual Studio Common Project System, Tauri, OpenGL",
    },
    { label: "Platforms", items: "Tizen, Windows, Linux, Android/iOS" },
    {
      label: "Concepts",
      items:
        "Data Structures & Algorithms, Object-Oriented Design, JWT / OAuth2 Authentication, Machine Learning, ISO 27001 / ISMS",
    },
  ],
  experience: [
    {
      company: "Samsung R&D Institute Bangladesh",
      location: "Dhaka, Bangladesh",
      role: "Software Engineer",
      period: "Mar 2024 – Present",
      points: [],
      projects: [
        {
          name: "Samsung Ring Plugin",
          stack: "Android, iOS",
          period: "Jan 2026 – Present",
          link: "",
          points: [
            "Refactored every byte parser on Android into a single generic parser while keeping backward compatibility with existing data formats.",
            "Designed new byte protocols for new health-sensing modules and implemented those modules end to end in the plugin.",
            "Diagnosed user-reported bugs by correlating ring binary data, plugin logs, and Samsung Health app logs to find the root cause.",
          ],
        },
        {
          name: "Device Manager",
          stack: "Tauri, React, TypeScript, Rust",
          period: "Dec 2025 – Jan 2026",
          link: "https://samsungtizenos.com/docs/sdk-tools/dotnet/visual-studio/vstools/tools/device-manager",
          points: [
            "Wrote about 80% of the codebase of a cross-platform desktop app that manages Tizen devices, shows live connection state, and connects to remote devices over IP.",
            "Built the entire frontend in React, TypeScript, HTML, and CSS.",
            "Wrote the Rust backend logic that fetches, filters, and updates device data, and the API layer between the UI and the backend.",
            "Connected the app to devices over SDB, Tizen’s equivalent of ADB, and took it through to production release.",
          ],
        },
        {
          name: "Tizen Doctor (CLI)",
          stack: "JavaScript, Node.js",
          period: "Jan 2025 – Dec 2025",
          link: "https://samsungtizenos.com/docs/sdk-tools/dotnet/visual-studio/baseline-sdk/common-tools/tizen-doctor",
          points: [
            "Researched and implemented the diagnostic commands for Linux, macOS, and Windows, working out the platform-specific checks for SDKs, build tools, and run readiness.",
            "Automated the developer-environment check across Visual Studio and VS Code for .NET, Web, and Native apps: it detects problems, fixes them, and tells developers how to resolve the rest.",
            "Wrote the tool’s complete official documentation.",
          ],
        },
        {
          name: "Visual Studio Extension for Tizen",
          stack: "C#, .NET",
          period: "Jun 2024 – Jan 2026",
          link: "",
          points: [
            "Developed new features and kept the extension up to date with each new Tizen version release.",
            "Fixed bugs in the extension and in the Baseline SDK tools (Package Manager, Device Manager, Emulator Manager), and added small features to them.",
            "Enabled debugging and app installation on RISC-V devices.",
            "Wrote the official documentation for my own features and for existing older features.",
          ],
        },
        {
          name: "Samsung Experience Services (SES)",
          stack: "QA rotation",
          period: "Mar 2024 – May 2024",
          link: "",
          points: [
            "Tested SES APIs during onboarding, then analysed and reported the defects found.",
          ],
        },
      ],
    },
    {
      company: "Makebell Limited",
      location: "Hong Kong SAR",
      role: "Security Engineer & ISO 27001 Consultant",
      period: "Jun 2026 – Aug 2026",
      points: [
        "Guided client organisations through designing, implementing, and maintaining an Information Security Management System (ISMS) for official ISO 27001 certification.",
        "Built the asset-based risk register, risk assessment and treatment methodology, and Statement of Applicability; mapped controls to evidence for the certification audit.",
      ],
      projects: [],
    },
  ],
  projects: [
    {
      name: "FastAPI Blog Platform",
      stack: "Python, FastAPI, PostgreSQL, AWS S3",
      link: "https://github.com/mizanurasif/Fast-API-Blog",
      points: [
        "Full-stack blogging platform with an async FastAPI JSON API (OpenAPI docs at /docs) built on SQLAlchemy 2.0 and PostgreSQL, plus a server-rendered Jinja2 + vanilla-JS frontend that uses the same API.",
        "Computed post scores in SQL with a correlated-subquery column_property, so posts sort by score in the database; used selectinload to avoid N+1 queries and database-level cascades to delete a user with one statement.",
        "Implemented OAuth2 password flow with JWT access tokens, Argon2 hashing, and single-use, expiring password-reset tokens stored only as SHA-256 hashes; the reset endpoint doesn’t reveal which emails are registered.",
        "Profile images are EXIF-corrected, cropped, and uploaded to AWS S3, with blocking boto3 calls moved to a threadpool. Tracked the move from SQLite to PostgreSQL in Alembic migrations. The async pytest suite rolls back each test’s transaction and mocks S3 with moto. Packaged with a multi-stage Docker build using uv.",
      ],
    },
    {
      name: "Shoe E-Commerce Platform",
      stack: "C#, ASP.NET Core, EF Core",
      link: "https://github.com/mizanurasif/A-Shoe-E-Commerce-Website-using-asp.net-",
      points: [
        "Full-stack web app with customer ordering and an admin back office for managing products, on a normalised Products / Orders / OrderDetails schema using Entity Framework Core code-first migrations, LINQ eager loading, and ASP.NET Core Identity authentication.",
      ],
    },
    {
      name: "Brain Tumor Segmentation",
      stack: "Undergrad Thesis, Python",
      link: "",
      points: [
        "Hybrid 3D segmentation model for MRI scans based on a modified U-Net with Dynamic Convolution and attention mechanisms; built the data pipeline, training loop, and evaluation.",
      ],
    },
    {
      name: "Chronic Kidney Disease Detection",
      stack: "Python, Machine Learning, Streamlit",
      link: "https://github.com/mizanurasif/Chronic-Kidney-Disease-Detection-using-ML",
      points: [
        "Classifier that predicts chronic kidney disease from clinical indicators (blood pressure, RBC, WBC, sugar level, etc.); cleaned the raw dataset, prepared features, trained and compared several classifiers, and deployed the model as a Streamlit web app.",
      ],
    },
    {
      name: "3D Bus Terminal",
      stack: "OpenGL 3.3, Computer Graphics",
      link: "https://github.com/mizanurasif/3D-bus-terminal-Design-using-Opengl-3.3",
      points: ["3D model of a bus terminal built with OpenGL 3.3."],
    },
    {
      name: "Smart Home and Security System",
      stack: "Arduino, Embedded Systems",
      link: "https://github.com/mizanurasif/Smart-Home-And-Security-System-peripheral-project-",
      points: [
        "Arduino-based home automation and security system using multiple sensors, a keypad, and a servo motor; automatically controls lights, doors, and the garage, with password-protected access.",
      ],
    },
  ],
  education: [
    {
      school: "Khulna University of Engineering & Technology (KUET)",
      location: "Khulna, Bangladesh",
      degree: "B.Sc. in Computer Science and Engineering · CGPA 3.43 / 4.00",
      period: "2019 – 2024",
    },
  ],
  achievements: [
    {
      label: "Competitive Programming",
      text: "Codeforces: mizanurasif02 (500+ solved) · LeetCode: mizanurasif (150+ solved)",
      link: "https://codeforces.com/profile/mizanurasif02",
    },
    {
      label: "Certification",
      text: "Samsung SWC Professional Exam, Passed",
      link: "https://drive.google.com/file/d/1Lb5RHzMGiVSsIdMrdiptU55DFeWxSiIo/view?usp=sharing",
    },
    {
      label: "Activities",
      text: "SGIPC, KUET: Member · Bit2Byte: Assistant General Secretary",
      link: "",
    },
  ],
};
