/** A price plus whether it came from a live API (true) or a fallback (false). */
export interface Priced {
  value: number;
  live: boolean;
}
