export type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Bumped on every result so the client reacts even to repeated outcomes. */
  at: number;
};

export const initialSaveState: SaveState = {
  status: "idle",
  message: "",
  at: 0,
};
