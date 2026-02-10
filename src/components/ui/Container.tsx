import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow" | "full";
}

/**
 * Layout container with consistent max-width and padding.
 * Replaces the .container-wide CSS class.
 */
export function Container({ 
  children, 
  className,
  size = "default" 
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-5",
        // Size variants
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-5xl",
        size === "wide" && "max-w-[1200px]",
        size === "full" && "max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page section with consistent vertical padding.
 */
interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
}

export function Section({ 
  children, 
  className,
  spacing = "md" 
}: SectionProps) {
  return (
    <section
      className={cn(
        spacing === "sm" && "py-8",
        spacing === "md" && "py-12",
        spacing === "lg" && "py-16",
        spacing === "xl" && "py-24",
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * Page heading with consistent styling.
 */
interface PageHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeading({ title, subtitle, className }: PageHeadingProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-bold text-[var(--text)]">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-[var(--text-secondary)]">{subtitle}</p>
      )}
    </div>
  );
}