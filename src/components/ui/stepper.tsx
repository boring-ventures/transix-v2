"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export interface StepProps {
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

export interface StepperProps {
  currentStep: number;
  className?: string;
  children: React.ReactNode;
}

export function Step({
  title,
  description,
  isCompleted = false,
  isActive = false,
}: StepProps) {
  return (
    <div className="flex-1">
      <div className="flex items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : isActive
                ? "border-primary text-primary"
                : "border-muted-foreground text-muted-foreground"
          )}
        >
          {isCompleted ? <CheckIcon className="h-4 w-4" /> : null}
          {!isCompleted && <span>{title.charAt(0)}</span>}
        </div>
        <div
          className={cn(
            "ml-4 flex flex-col",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <span className="text-sm font-medium">{title}</span>
          {description && <span className="text-xs">{description}</span>}
        </div>
      </div>
    </div>
  );
}

export function Stepper({ currentStep, className, children }: StepperProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<StepProps>(child)) {
          return React.cloneElement(child, {
            isCompleted: index < currentStep,
            isActive: index === currentStep,
          });
        }
        return child;
      })}
    </div>
  );
}
