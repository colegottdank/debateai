import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ArtisticCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "subtle";
}

/**
 * Card component with glassmorphism effect.
 * Replaces the .artistic-card CSS class.
 * 
 * Features:
 * - Dark mode: glass effect with blur
 * - Light mode: clean white with subtle shadow
 * - Backdrop blur for modern feel
 */
export function ArtisticCard({ 
  children, 
  className,
  variant = "default" 
}: ArtisticCardProps) {
  return (
    <div
      className={cn(
        // Base styles (dark mode default)
        "rounded-3xl overflow-hidden",
        "bg-[rgba(28,25,23,0.6)]",
        "backdrop-blur-2xl",
        "border border-white/10",
        
        // Light mode override
        "light:bg-white light:border-black/[0.08]",
        "light:shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)]",
        
        // Variants
        variant === "elevated" && "shadow-2xl",
        variant === "subtle" 
&& "bg-[rgba(28,25,23,0.3)] border-white/5",
        
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card header with consistent padding.
 */
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-white/10 light:border-black/[0.06]", className)}>
      {children}
    </div>
  );
}

/**
 * Card body with consistent padding.
 */
interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

/**
 * Card footer with consistent padding and border.
 */
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-white/10 light:border-black/[0.06]", className)}>
      {children}
    </div>
  );
}