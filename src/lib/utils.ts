import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes with proper precedence.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 * 
 * @example
 * cn("px-4 py-2", isActive && "bg-accent", className)
 * // Returns: "px-4 py-2 bg-accent" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}