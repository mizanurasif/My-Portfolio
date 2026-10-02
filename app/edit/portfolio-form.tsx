"use client";

import { useActionState, useState } from "react";

import type {
  Achievement,
  Education,
  Job,
  Portfolio,
  Project,
  Skill,
  SubProject,
} from "@/lib/portfolio";
import { submitPortfolio } from "./actions";
import { initialSaveState } from "./types";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-black/40 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";
const smallButton =
  "text-sm text-zinc-500 underline underline-offset-4 hover:text-black dark:hover:text-zinc-50";
const removeButton =
  "text-sm text-zinc-500 underline underline-offset-4 hover:text-red-600 dark:hover:text-red-400";

// Bullet lists are edited as a textarea, one bullet per line. Empty lines are
// dropped when the portfolio is saved.
const toLines = (points: string[]) => points.join("\n");
const fromLines = (text: string) => text.split("\n");

function patchAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

const emptySkill: Skill = { label: "", items: "" };
const emptySubProject: SubProject = { name: "", stack: "", period: "", link: "", points: [] };
const emptyJob: Job = {
  company: "",
  location: "",
  role: "",
  period: "",
  points: [],
  projects: [],
};
const emptyProject: Project = { name: "", stack: "", link: "", points: [] };
const emptyEducation: Education = { school: "", location: "", degree: "", period: "" };
const emptyAchievement: Achievement = { label: "", text: "", link: "" };

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Renders a textarea when set. */
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>
        {label}
        {hint ? <span className="ml-2 font-normal text-zinc-400">{hint}</span> : null}
      </span>
      {rows ? (
        <textarea
          rows={rows}
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function Section({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-black/[.08] pt-8 dark:border-white/[.12]">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {onAdd ? (
          <button type="button" onClick={onAdd} className={smallButton}>
            + {addLabel}
          </button>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}

function Card({
  title,
  onRemove,
  children,
  nested,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-5 ${
        nested
          ? "border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-black"
          : "border-black/[.08] bg-white dark:border-white/[.12] dark:bg-zinc-950"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-black dark:text-zinc-50">{title}</span>
        <button type="button" onClick={onRemove} className={removeButton}>
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

const twoCols = "grid gap-4 sm:grid-cols-2";

export function PortfolioForm({ initial }: { initial: Portfolio }) {
  const [state, formAction, pending] = useActionState(
    submitPortfolio,
    initialSaveState
  );
  const [p, setP] = useState<Portfolio>(initial);

  function set<K extends keyof Portfolio>(key: K, value: Portfolio[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <input type="hidden" name="portfolio" value={JSON.stringify(p)} />

      <Section title="Profile">
        <div className={twoCols}>
          <Field label="Name" value={p.name} onChange={(v) => set("name", v)} />
          <Field
            label="Headline"
            value={p.headline}
            placeholder="Software Engineer"
            onChange={(v) => set("headline", v)}
          />
          <Field label="Location" value={p.location} onChange={(v) => set("location", v)} />
          <Field label="Email" value={p.email} onChange={(v) => set("email", v)} />
          <Field label="Phone" value={p.phone} onChange={(v) => set("phone", v)} />
          <Field
            label="GitHub URL"
            value={p.github}
            placeholder="https://github.com/…"
            onChange={(v) => set("github", v)}
          />
          <Field
            label="LinkedIn URL"
            value={p.linkedin}
            placeholder="https://www.linkedin.com/in/…"
            onChange={(v) => set("linkedin", v)}
          />
        </div>
        <Field
          label="Summary"
          hint="one point per line"
          rows={6}
          value={toLines(p.summary)}
          onChange={(v) => set("summary", fromLines(v))}
        />
      </Section>

      <Section
        title="Skills"
        addLabel="Add skill group"
        onAdd={() => set("skills", [...p.skills, emptySkill])}
      >
        {p.skills.map((skill, i) => (
          <Card
            key={i}
            title={skill.label || "New skill group"}
            onRemove={() => set("skills", removeAt(p.skills, i))}
          >
            <Field
              label="Group"
              value={skill.label}
              placeholder="Languages"
              onChange={(v) => set("skills", patchAt(p.skills, i, { label: v }))}
            />
            <Field
              label="Skills"
              hint="comma-separated"
              value={skill.items}
              placeholder="C#, Python, TypeScript"
              onChange={(v) => set("skills", patchAt(p.skills, i, { items: v }))}
            />
          </Card>
        ))}
      </Section>

      <Section
        title="Experience"
        addLabel="Add job"
        onAdd={() => set("experience", [...p.experience, emptyJob])}
      >
        {p.experience.map((job, i) => {
          const patchJob = (patch: Partial<Job>) =>
            set("experience", patchAt(p.experience, i, patch));

          return (
            <Card
              key={i}
              title={job.company || "New job"}
              onRemove={() => set("experience", removeAt(p.experience, i))}
            >
              <div className={twoCols}>
                <Field label="Company" value={job.company} onChange={(v) => patchJob({ company: v })} />
                <Field label="Role" value={job.role} onChange={(v) => patchJob({ role: v })} />
                <Field label="Location" value={job.location} onChange={(v) => patchJob({ location: v })} />
                <Field
                  label="Period"
                  value={job.period}
                  placeholder="Mar 2024 – Present"
                  onChange={(v) => patchJob({ period: v })}
                />
              </div>
              <Field
                label="Highlights"
                hint="one per line"
                rows={3}
                value={toLines(job.points)}
                onChange={(v) => patchJob({ points: fromLines(v) })}
              />

              <div className="flex items-baseline justify-between gap-4">
                <span className={labelClass}>Projects at this job</span>
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => patchJob({ projects: [...job.projects, emptySubProject] })}
                >
                  + Add project
                </button>
              </div>
              {job.projects.map((sp, k) => {
                const patchSub = (patch: Partial<SubProject>) =>
                  patchJob({ projects: patchAt(job.projects, k, patch) });

                return (
                  <Card
                    key={k}
                    nested
                    title={sp.name || "New project"}
                    onRemove={() => patchJob({ projects: removeAt(job.projects, k) })}
                  >
                    <div className={twoCols}>
                      <Field label="Name" value={sp.name} onChange={(v) => patchSub({ name: v })} />
                      <Field label="Stack" value={sp.stack} onChange={(v) => patchSub({ stack: v })} />
                      <Field label="Period" value={sp.period} onChange={(v) => patchSub({ period: v })} />
                      <Field
                        label="Link"
                        value={sp.link}
                        placeholder="https://…"
                        onChange={(v) => patchSub({ link: v })}
                      />
                    </div>
                    <Field
                      label="Highlights"
                      hint="one per line"
                      rows={4}
                      value={toLines(sp.points)}
                      onChange={(v) => patchSub({ points: fromLines(v) })}
                    />
                  </Card>
                );
              })}
            </Card>
          );
        })}
      </Section>

      <Section
        title="Projects"
        addLabel="Add project"
        onAdd={() => set("projects", [...p.projects, emptyProject])}
      >
        {p.projects.map((project, i) => {
          const patchProject = (patch: Partial<Project>) =>
            set("projects", patchAt(p.projects, i, patch));

          return (
            <Card
              key={i}
              title={project.name || "New project"}
              onRemove={() => set("projects", removeAt(p.projects, i))}
            >
              <div className={twoCols}>
                <Field label="Name" value={project.name} onChange={(v) => patchProject({ name: v })} />
                <Field label="Stack" value={project.stack} onChange={(v) => patchProject({ stack: v })} />
              </div>
              <Field
                label="Source link"
                value={project.link}
                placeholder="https://github.com/…"
                onChange={(v) => patchProject({ link: v })}
              />
              <Field
                label="Description"
                hint="one point per line"
                rows={4}
                value={toLines(project.points)}
                onChange={(v) => patchProject({ points: fromLines(v) })}
              />
            </Card>
          );
        })}
      </Section>

      <Section
        title="Education"
        addLabel="Add education"
        onAdd={() => set("education", [...p.education, emptyEducation])}
      >
        {p.education.map((edu, i) => {
          const patchEdu = (patch: Partial<Education>) =>
            set("education", patchAt(p.education, i, patch));

          return (
            <Card
              key={i}
              title={edu.school || "New education"}
              onRemove={() => set("education", removeAt(p.education, i))}
            >
              <div className={twoCols}>
                <Field label="School" value={edu.school} onChange={(v) => patchEdu({ school: v })} />
                <Field label="Location" value={edu.location} onChange={(v) => patchEdu({ location: v })} />
                <Field label="Degree" value={edu.degree} onChange={(v) => patchEdu({ degree: v })} />
                <Field label="Period" value={edu.period} onChange={(v) => patchEdu({ period: v })} />
              </div>
            </Card>
          );
        })}
      </Section>

      <Section
        title="Achievements & Activities"
        addLabel="Add achievement"
        onAdd={() => set("achievements", [...p.achievements, emptyAchievement])}
      >
        {p.achievements.map((a, i) => {
          const patchAchievement = (patch: Partial<Achievement>) =>
            set("achievements", patchAt(p.achievements, i, patch));

          return (
            <Card
              key={i}
              title={a.label || "New achievement"}
              onRemove={() => set("achievements", removeAt(p.achievements, i))}
            >
              <div className={twoCols}>
                <Field label="Label" value={a.label} onChange={(v) => patchAchievement({ label: v })} />
                <Field
                  label="Link"
                  value={a.link}
                  placeholder="https://…"
                  onChange={(v) => patchAchievement({ link: v })}
                />
              </div>
              <Field label="Text" value={a.text} onChange={(v) => patchAchievement({ text: v })} />
            </Card>
          );
        })}
      </Section>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-4 border-t border-black/[.08] bg-zinc-50/90 px-6 py-4 backdrop-blur sm:-mx-10 sm:px-10 dark:border-white/[.12] dark:bg-black/90">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          {pending ? "Saving…" : "Save portfolio"}
        </button>
        {state.message ? (
          <p
            role="status"
            className={
              state.status === "error"
                ? "text-sm text-red-600 dark:text-red-400"
                : "text-sm text-emerald-600 dark:text-emerald-400"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
