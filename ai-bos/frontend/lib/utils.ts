/**
 * cn() merges Tailwind classes safely — clsx handles conditional
 * classes, tailwind-merge resolves conflicts (e.g. "p-2 p-4" -> "p-4").
 * Every component that accepts a `className` prop should use this
 * instead of manual string concatenation.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
