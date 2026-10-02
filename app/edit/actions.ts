"use server";

import { revalidatePath } from "next/cache";

import { normalizePortfolio, savePortfolio } from "@/lib/portfolio";
import type { SaveState } from "./types";

function result(status: "success" | "error", message: string): SaveState {
  return { status, message, at: Date.now() };
}

export async function submitPortfolio(
  _prevState: SaveState,
  formData: FormData
): Promise<SaveState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("portfolio") ?? ""));
  } catch {
    return result("error", "The form data could not be read.");
  }

  const portfolio = normalizePortfolio(raw);
  if (!portfolio.name) {
    return result("error", "Name is required.");
  }

  try {
    await savePortfolio(portfolio);
  } catch (error) {
    return result(
      "error",
      error instanceof Error ? error.message : "Database error."
    );
  }

  revalidatePath("/");
  revalidatePath("/edit");
  return result("success", "Portfolio saved to MongoDB.");
}
