import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { defaultPortfolio, getPortfolio, type Portfolio } from "@/lib/portfolio";
import { PortfolioForm } from "./portfolio-form";

export const metadata: Metadata = {
  title: "Edit portfolio",
  description: "Edit the portfolio stored in MongoDB.",
};

export default async function EditPage() {
  // Never prerender this at build time — it needs the live database.
  await connection();

  let portfolio: Portfolio = defaultPortfolio;
  let dbError: string | null = null;
  try {
    portfolio = await getPortfolio();
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Cannot reach MongoDB.";
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl px-6 py-20 sm:px-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Edit portfolio
          </h1>
          <Link
            href="/"
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-black dark:hover:text-zinc-50"
          >
            View portfolio
          </Link>
        </div>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Saved as one document in the <code className="font-mono">Portfolio</code>{" "}
          collection in MongoDB.
        </p>

        {dbError ? (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            Could not read from MongoDB: {dbError}
          </p>
        ) : null}

        <div className="mt-10">
          <PortfolioForm initial={portfolio} />
        </div>
      </main>
    </div>
  );
}
