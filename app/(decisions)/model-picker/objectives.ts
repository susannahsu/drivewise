/**
 * Ranking objectives for the model picker. Kept in a plain module (not the
 * "use server" actions file, which may only export async functions) so both the
 * client page and the server action can import these values/types.
 */
export const OBJECTIVES = {
  lowest_tco: "Lowest total cost",
  best_efficiency: "Best fuel efficiency",
  slowest_depreciation: "Holds value best",
  most_reliable: "Most reliable",
} as const;

export type Objective = keyof typeof OBJECTIVES;
