import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepIndicatorProps } from "./types";

export function StepIndicator({
  label,
  description,
  icon,
  active,
  completed,
  onClick,
}: StepIndicatorProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center text-center cursor-pointer bg-transparent border-0"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-2",
          active
            ? "bg-primary text-primary-foreground"
            : completed
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
        )}
      >
        {completed ? <Check className="h-5 w-5" /> : icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-muted-foreground max-w-[120px]">
        {description}
      </span>
    </button>
  );
}
