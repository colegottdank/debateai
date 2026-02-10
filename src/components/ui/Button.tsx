import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    isLoading = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          
          // Variants
          variant === "primary" && "bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-hover)] active:scale-[0.98]",
          
          variant === "secondary" && [
            "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]",
            "hover:bg-[var(--bg-sunken)] hover:border-[var(--border-strong)]",
            "active:scale-[0.98]"
          ],
          
          variant === "ghost" && [
            "bg-transparent text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-sunken)] hover:text-[var(--text)]",
            "active:scale-[0.98]"
          ],
          
          variant === "danger" && [
            "bg-red-600 text-white shadow-sm",
            "hover:bg-red-700",
            "active:scale-[0.98]"
          ],
          
          // Sizes
          size === "sm" && "px-3.5 py-1.5 text-sm h-9",
          size === "md" && "px-5 py-2.5 text-sm h-10",
          size === "lg" && "px-7 py-3.5 text-base h-12",
          
          // Loading state
          isLoading && "relative text-transparent",
          
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="animate-spin h-4 w-4 text-current" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };