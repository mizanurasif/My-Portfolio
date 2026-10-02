import Link from "next/link";
import { connection } from "next/server";

import {
  defaultPortfolio,
  getPortfolio,
  safeUrl,
  type Portfolio,
} from "@/lib/portfolio";

const sectionTitle =
  "text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400";
const pointClass =
  "pl-5 leading-7 text-zinc-600 before:-ml-5 before:mr-2 before:content-['—'] dark:text-zinc-400";
const pillLink =
  "flex h-11 items-center justify-center rounded-full border border-black/10 px-5 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

function Points({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {points.map((point, i) => (
        <li key={i} className={pointClass}>
          {point}
        </li>
      ))}
    </ul>
  );
}

function MaybeLink({ href, children }: { href: string; children: React.ReactNode }) {
  const url = safeUrl(href);
  if (!url) return <>{children}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-black/20 underline-offset-4 hover:decoration-black dark:decoration-white/30 dark:hover:decoration-white"
    >
      {children}
    </a>
  );
}

export default async function Home() {
  // Never prerender this at build time — it needs the live database.
  await connection();

  let portfolio: Portfolio = defaultPortfolio;
  let dbError: string | null = null;
  try {
    portfolio = await getPortfolio();
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Cannot reach MongoDB.";
  }

  const p = portfolio;

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl px-6 py-20 sm:px-10">
        {dbError ? (
          <p className="mb-10 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
            Showing the default portfolio — could not read from MongoDB: {dbError}
          </p>
        ) : null}

        {/* Hero */}
        <section>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
              {p.name}
            </h1>
            <Link
              href="/edit"
              className="mt-2 shrink-0 text-sm text-zinc-500 underline underline-offset-4 hover:text-black dark:hover:text-zinc-50"
            >
              Edit
            </Link>
          </div>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            {[p.headline, p.location].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
            {p.email ? (
              <a
                className="flex h-11 items-center justify-center rounded-full bg-black px-5 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
                href={`mailto:${p.email}`}
              >
                Email me
              </a>
            ) : null}
            {safeUrl(p.github) ? (
              <a className={pillLink} href={p.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            ) : null}
            {safeUrl(p.linkedin) ? (
              <a className={pillLink} href={p.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            ) : null}
          </div>
        </section>

        {/* Summary */}
        {p.summary.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>About</h2>
            <Points points={p.summary} />
          </section>
        ) : null}

        {/* Skills */}
        {p.skills.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>Skills</h2>
            <div className="mt-5 flex flex-col gap-5">
              {p.skills.map((skill, i) => (
                <div key={i}>
                  <h3 className="text-sm font-medium text-black dark:text-zinc-50">
                    {skill.label}
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {skill.items
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((item) => (
                        <li
                          key={item}
                          className="rounded-full bg-black/[.06] px-3 py-1.5 font-mono text-sm text-zinc-800 dark:bg-white/[.08] dark:text-zinc-200"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Experience */}
        {p.experience.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>Experience</h2>
            <div className="mt-5 flex flex-col gap-10">
              {p.experience.map((job, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-medium text-black dark:text-zinc-50">
                      {job.role} · {job.company}
                    </h3>
                    <span className="font-mono text-xs text-zinc-500">{job.period}</span>
                  </div>
                  {job.location ? (
                    <p className="mt-1 text-sm text-zinc-500">{job.location}</p>
                  ) : null}
                  <Points points={job.points} />

                  {job.projects.length > 0 ? (
                    <div className="mt-5 flex flex-col gap-6 border-l border-black/[.08] pl-5 dark:border-white/[.12]">
                      {job.projects.map((sp, k) => (
                        <div key={k}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                            <h4 className="font-medium text-zinc-800 dark:text-zinc-200">
                              <MaybeLink href={sp.link}>{sp.name}</MaybeLink>
                            </h4>
                            <span className="font-mono text-xs text-zinc-500">
                              {sp.period}
                            </span>
                          </div>
                          {sp.stack ? (
                            <p className="mt-1 font-mono text-xs text-zinc-500">{sp.stack}</p>
                          ) : null}
                          <Points points={sp.points} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Projects */}
        {p.projects.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>Projects</h2>
            <div className="mt-5 flex flex-col gap-4">
              {p.projects.map((project, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.12] dark:bg-zinc-950"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-medium text-black dark:text-zinc-50">
                      {project.name}
                    </h3>
                    {safeUrl(project.link) ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-500 underline underline-offset-4 hover:text-black dark:hover:text-zinc-50"
                      >
                        Source
                      </a>
                    ) : null}
                  </div>
                  {project.stack ? (
                    <p className="mt-1 font-mono text-xs text-zinc-500">{project.stack}</p>
                  ) : null}
                  <Points points={project.points} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Education */}
        {p.education.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>Education</h2>
            <div className="mt-5 flex flex-col gap-5">
              {p.education.map((edu, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-medium text-black dark:text-zinc-50">{edu.school}</h3>
                    <span className="font-mono text-xs text-zinc-500">{edu.period}</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{edu.degree}</p>
                  {edu.location ? (
                    <p className="text-sm text-zinc-500">{edu.location}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Achievements */}
        {p.achievements.length > 0 ? (
          <section className="mt-16">
            <h2 className={sectionTitle}>Achievements &amp; Activities</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {p.achievements.map((a, i) => (
                <li key={i} className="leading-7 text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-black dark:text-zinc-50">{a.label}:</span>{" "}
                  <MaybeLink href={a.link}>{a.text}</MaybeLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Contact */}
        <section className="mt-16 border-t border-black/[.08] pt-8 dark:border-white/[.12]">
          <p className="leading-7 text-zinc-600 dark:text-zinc-400">
            Open to interesting work.{" "}
            {p.email ? (
              <a
                href={`mailto:${p.email}`}
                className="font-medium text-black underline underline-offset-4 dark:text-zinc-50"
              >
                {p.email}
              </a>
            ) : null}
            {p.phone ? <span> · {p.phone}</span> : null}
          </p>
        </section>
      </main>
    </div>
  );
}
